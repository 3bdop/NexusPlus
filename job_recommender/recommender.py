# job_recommender/recommender.py

import numpy as np
import faiss
from .embedding import embedding_model, cross_encoder
from .experience_extractor import extract_experience

class JobRecommender:
    def __init__(self, job_postings: list, job_embeddings=None, index=None):
        self.job_postings = job_postings
        self.job_ids = [job['id'] for job in job_postings]
        self.job_texts = [job['title'] + ". " + job['description'] for job in job_postings]
        
        if job_embeddings is None or index is None:
            self.job_embeddings = embedding_model.encode(
                self.job_texts, 
                batch_size=128, 
                convert_to_numpy=True, 
                show_progress_bar=True
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

    def calculate_experience_score(self, candidate_exp: int, job_exp: int) -> float:
        """
        Calculate an experience match score based on candidate and job experience requirements.
        """
        if job_exp == 0:
            return 1.0  # Perfect match if no experience required
            
        if candidate_exp == 0 and job_exp > 0:
            return 0.3  # Base score for no experience
            
        ratio = candidate_exp / max(job_exp, 1)  # Avoid division by zero
        
        if ratio >= 0.9:
            return 1.0
        elif ratio >= 0.7:
            return 0.85
        elif ratio >= 0.5:
            return 0.7
        elif ratio >= 0.3:
            return 0.5
        else:
            return 0.3

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

    def recommend(self, cv_text: str, top_k: int = 5, candidate_k: int = 20) -> list:
        # Extract candidate's experience
        candidate_experience = extract_experience(cv_text)
        candidate_level = self.get_experience_level(candidate_experience)
        
        # Get initial semantic similarity matches
        cv_embedding = embedding_model.encode([cv_text], convert_to_numpy=True)
        cv_embedding = cv_embedding / np.linalg.norm(cv_embedding, axis=1, keepdims=True)
        
        # Get initial candidates
        distances, indices = self.index.search(cv_embedding, candidate_k)
        
        # Prepare candidates with initial similarity scores
        candidate_jobs = []
        for idx, similarity_score in zip(indices[0], distances[0]):
            if idx < len(self.job_postings):
                job = self.job_postings[idx].copy()
                # Convert similarity score to percentage (FAISS returns cosine similarity)
                job['similarity_score'] = float(similarity_score) * 100
                candidate_jobs.append(job)
        
        # Rerank using cross-encoder
        cross_inp = [[cv_text, job['title'] + ". " + job['description']] 
                    for job in candidate_jobs]
        cross_scores = cross_encoder.predict(cross_inp)
        
        # Normalize cross-encoder scores
        if len(cross_scores) > 0:  # Check if we have any scores
            min_score = min(cross_scores)
            max_score = max(cross_scores)
            score_range = max_score - min_score if max_score > min_score else 1
            
            # Process each job
            for job, cross_score in zip(candidate_jobs, cross_scores):
                # Get job experience requirements
                job_experience = extract_experience(job['description'])
                job_level = self.get_experience_level(job_experience)
                
                # Calculate normalized semantic similarity (0-100 scale)
                normalized_score = ((cross_score - min_score) / score_range) * 100
                
                # Calculate experience match score (0-100 scale)
                exp_score = self.calculate_experience_score(candidate_experience, job_experience) * 100
                
                # Store all scores and details
                job['semantic_match'] = max(min(normalized_score, 100), 0)  # Clip to 0-100
                job['experience_match'] = exp_score
                job['required_experience'] = job_experience
                job['experience_level'] = job_level
                
                # Calculate final score (weighted average)
                job['final_score'] = (job['semantic_match'] * 0.7) + (job['experience_match'] * 0.3)
                
                # Add match details for display
                job['match_details'] = {
                    'title': job['title'],
                    'semantic_match': f"{job['semantic_match']:.0f}%",
                    'experience_match': f"{job['experience_match']:.0f}%",
                    'overall_match': f"{job['final_score']:.0f}%",
                    'required_experience': f"{job_experience} years",
                    'experience_level': job_level,
                    'candidate_level': candidate_level
                }
        
        # Sort by final score and return top_k
        candidate_jobs.sort(key=lambda x: x['final_score'], reverse=True)
        return candidate_jobs[:top_k]