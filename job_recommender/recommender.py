# job_recommender/recommender.py

import numpy as np
import faiss
import math
from .embedding import embedding_model, cross_encoder
from .experience_extractor import extract_experience

class JobRecommender:
    def __init__(self, job_postings: list, job_embeddings=None, index=None):
        self.job_postings = job_postings
        self.job_texts = [f"{job['title']}. {job['description']}" for job in job_postings]
        
        if job_embeddings is None or index is None:
            self.job_embeddings = embedding_model.encode(
                self.job_texts, batch_size=128, convert_to_numpy=True, show_progress_bar=True
            )
            self.job_embeddings = self.normalize_embeddings(self.job_embeddings)
            dimension = self.job_embeddings.shape[1]
            self.index = faiss.IndexFlatIP(dimension)
            self.index.add(self.job_embeddings)
        else:
            self.job_embeddings = job_embeddings
            self.index = index

    @staticmethod
    def normalize_embeddings(embeddings: np.ndarray) -> np.ndarray:
        norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
        return embeddings / norms

    @staticmethod
    def logistic_transform(x: float, k: float = 0.1, x0: float = 50) -> float:
        """
        Applies a logistic transformation to x (expected to be between 0 and 100).
        Returns a value between 0 and 1.
        """
        return 1 / (1 + math.exp(-k * (x - x0)))

    def calculate_experience_score(self, candidate_exp: int, job_exp: int) -> float:
        if job_exp == 0:
            return 1.0
        if candidate_exp == 0:
            return 0.3
        if candidate_exp <= job_exp:
            return 0.3 + (candidate_exp / job_exp) * 0.7
        else:
            over_ratio = (candidate_exp - job_exp) / job_exp
            penalty = min(over_ratio * 0.1, 0.1)
            return max(1.0 - penalty, 0.9)

    def get_experience_level(self, years: int) -> str:
        if years == 0:
            return "Entry Level"
        elif years <= 2:
            return "Junior"
        elif years <= 5:
            return "Mid-Level"
        elif years <= 8:
            return "Senior"
        else:
            return "Expert"

    @staticmethod
    def calculate_entity_match(candidate_entities: list, job_text: str) -> float:
        """
        Computes the fraction of candidate entities present in the job description.
        """
        if not candidate_entities:
            return 0.0
        job_text_lower = job_text.lower()
        match_count = sum(1 for ent in candidate_entities if ent.get("entity", "").lower() in job_text_lower)
        return match_count / len(candidate_entities)

    def recommend(self, cv_text: str, candidate_entities: list, top_k: int = 5, candidate_k: int = 20) -> list:
        candidate_exp = extract_experience(cv_text)
        cv_embedding = embedding_model.encode([cv_text], convert_to_numpy=True)
        cv_embedding = cv_embedding / np.linalg.norm(cv_embedding, axis=1, keepdims=True)
        distances, indices = self.index.search(cv_embedding, candidate_k)
        
        candidate_jobs = []
        for idx, similarity_score in zip(indices[0], distances[0]):
            if idx < len(self.job_postings):
                job = self.job_postings[idx].copy()
                job['similarity_score'] = float(similarity_score) * 100  # raw semantic score (percentage)
                candidate_jobs.append(job)
        
        cross_inp = [[cv_text, f"{job['title']}. {job['description']}"] for job in candidate_jobs]
        cross_scores = cross_encoder.predict(cross_inp)
        
        if cross_scores is not None and cross_scores.size > 0:
            min_score = min(cross_scores)
            max_score = max(cross_scores)
            score_range = max_score - min_score if max_score > min_score else 1
            
            for job, cross_score in zip(candidate_jobs, cross_scores):
                job_exp = extract_experience(job['description'])
                raw_semantic = ((cross_score - min_score) / score_range) * 100  # in percentage
                raw_experience = self.calculate_experience_score(candidate_exp, job_exp) * 100
                raw_entity = self.calculate_entity_match(candidate_entities, job['description']) * 100

                # Apply logistic transformation to each raw score
                S_mapped = self.logistic_transform(raw_semantic)
                E_mapped = self.logistic_transform(raw_experience)
                N_mapped = self.logistic_transform(raw_entity)

                # New final score as weighted sum of transformed scores
                final_score = 100 * (0.5 * S_mapped + 0.3 * E_mapped + 0.2 * N_mapped)
                
                job.update({
                    "semantic_match": raw_semantic,
                    "experience_match": raw_experience,
                    "entity_match": raw_entity,
                    "final_score": final_score,
                    "required_experience": job_exp,
                    "experience_level": self.get_experience_level(job_exp)
                })
                job["match_details"] = {
                    'title': job['title'],
                    'semantic_match': f"{raw_semantic:.0f}%",
                    'experience_match': f"{raw_experience:.0f}%",
                    'entity_match': f"{raw_entity:.0f}%",
                    'overall_match': f"{final_score:.0f}%",
                    'required_experience': f"{job_exp} years",
                    'experience_level': job["experience_level"]
                }
        candidate_jobs.sort(key=lambda x: x['final_score'], reverse=True)
        return candidate_jobs[:top_k]
