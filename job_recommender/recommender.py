# job_recommender/recommender.py

import numpy as np
import faiss
from .embedding import embedding_model, cross_encoder

class JobRecommender:
    """
    JobRecommender uses a FAISS index (with precomputed embeddings) and a cross-encoder to recommend jobs.
    """
    def __init__(self, job_postings: list, job_embeddings=None, index=None):
        self.job_postings = job_postings
        self.job_ids = [job['id'] for job in job_postings]
        self.job_texts = [job['title'] + ". " + job['description'] for job in job_postings]
        
        if job_embeddings is None or index is None:
            # Compute embeddings and build the FAISS index if not provided
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

    def recommend(self, cv_text: str, top_k: int = 5, candidate_k: int = 20) -> list:
        # Compute embedding for the CV text
        cv_embedding = embedding_model.encode([cv_text], convert_to_numpy=True)
        cv_embedding = cv_embedding / np.linalg.norm(cv_embedding, axis=1, keepdims=True)
        
        # Retrieve candidate job indices using FAISS
        distances, indices = self.index.search(cv_embedding, candidate_k)
        candidate_jobs = []
        for idx, score in zip(indices[0], distances[0]):
            if idx < len(self.job_postings):
                candidate_jobs.append(self.job_postings[idx])
        
        # Re-rank candidates using the cross-encoder
        cross_inp = [
            [cv_text, job['title'] + ". " + job['description']]
            for job in candidate_jobs
        ]
        rerank_scores = cross_encoder.predict(cross_inp)
        
        for job, score in zip(candidate_jobs, rerank_scores):
            job['score'] = score
        candidate_jobs = sorted(candidate_jobs, key=lambda x: x['score'], reverse=True)
        return candidate_jobs[:top_k]
