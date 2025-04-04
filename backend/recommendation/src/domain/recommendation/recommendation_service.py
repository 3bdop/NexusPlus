# src/domain/recommendation/recommendation_service.py

import numpy as np
from typing import List, Dict
from sklearn.metrics.pairwise import cosine_similarity

from src.utils.db_service import (
    get_all_job_embeddings,
    get_job_details_by_ids,
    get_job_skills_by_ids
)
from src.domain.cv.processor import get_cv_embedding

class JobRecommender:
    def __init__(self):
        self.job_embeddings = []
        self.jobs_collection = None

    def load_jobs(self, jobs_collection) -> None:
        """Load job embeddings from MongoDB."""
        self.jobs_collection = jobs_collection
        self.job_embeddings = get_all_job_embeddings(jobs_collection)
        print(f"Loaded {len(self.job_embeddings)} jobs from database")

    def create_cv_embedding(self, cv_text: str) -> np.ndarray:
        """Create embedding from CV text using the same model as jobs."""
        return get_cv_embedding(cv_text)

    def calculate_experience_match_score(self, user_experience: str, job_experience: str) -> float:
        """
        Calculate a match score between user experience level and job required experience.
        """
        user_exp = user_experience.lower().strip()
        job_exp = job_experience.lower().strip()

        # Levels for consistent comparisons
        experience_levels = {
            "entry level": 1,
            "associate": 2,
            "mid level": 3,
            "senior": 4,
            "executive": 5
        }

        user_level = experience_levels.get(user_exp, 0)
        job_level = experience_levels.get(job_exp, 0)

        if user_level == 0 or job_level == 0:
            return 0.5  # Neutral if unknown
        diff = abs(user_level - job_level)
        if diff == 0:
            return 1.0
        elif diff == 1:
            return 0.5
        elif diff == 2:
            return 0.2
        else:
            return 0.1

    def calculate_skills_match_score(self, user_skills: list, job_skills: list) -> float:
        """
        Calculate similarity score between user skills and job required skills.
        """
        if not user_skills or not job_skills:
            return 0.5

        user_skills_norm = [s.lower().strip() for s in user_skills]
        job_skills_norm = [s.lower().strip() for s in job_skills]
        matching_skills = set(user_skills_norm) & set(job_skills_norm)

        job_coverage = len(matching_skills) / len(job_skills_norm)
        user_coverage = len(matching_skills) / len(user_skills_norm)

        return (0.7 * job_coverage) + (0.3 * user_coverage)

    def get_recommendations(
        self,
        cv_embedding: np.ndarray,
        user_experience: str,
        user_skills: list,
        top_k: int = 5,
        min_similarity: float = 0.5,
        content_weight: float = 0.7,
        experience_weight: float = 0.2,
        skills_weight: float = 0.1,
        db = None
    ) -> List[Dict]:
        """
        Get job recommendations based on CV embedding, experience level, and skills.
        """
        if not self.job_embeddings or self.jobs_collection is None:
            return []

        job_vectors = np.array([job['embedding'] for job in self.job_embeddings])
        content_similarities = cosine_similarity([cv_embedding], job_vectors)[0]

        final_scores = []
        for idx, content_score in enumerate(content_similarities):
            job = self.job_embeddings[idx]
            # Experience
            experience_score = self.calculate_experience_match_score(
                user_experience,
                job.get('experience', 'entry level')
            )
            # Skills
            job_skills = get_job_skills_by_ids(self.jobs_collection, [job['id']]).get(job['id'], [])
            skills_score = self.calculate_skills_match_score(user_skills, job_skills)

            final_score = (
                (content_score * content_weight) +
                (experience_score * experience_weight) +
                (skills_score * skills_weight)
            )
            final_scores.append(final_score)

        final_scores = np.array(final_scores)
        top_indices = np.argsort(final_scores)[-top_k:][::-1]

        recommendations = []
        job_ids_to_fetch = []
        for idx in top_indices:
            if final_scores[idx] < min_similarity:
                # If you only want to show jobs above some threshold, skip if below
                continue
            job = self.job_embeddings[idx]
            job_id = job['id']
            job_ids_to_fetch.append(job_id)

            # Re-fetch the job skills for matching
            job_skills = get_job_skills_by_ids(self.jobs_collection, [job_id]).get(job_id, [])

            recommendations.append({
                'job_id': job_id,
                'content_similarity': float(content_similarities[idx]),
                'experience_match': float(self.calculate_experience_match_score(
                    user_experience,
                    job.get('experience', 'entry level')
                )),
                'skills_match': float(self.calculate_skills_match_score(
                    user_skills,
                    job_skills
                )),
                'final_score': float(final_scores[idx]),
                'experience': job.get('experience', 'Not specified'),
                'matching_skills': list(set(user_skills) & set(job_skills)),
                'required_skills': job_skills
            })

        # Add job details
        if recommendations:
            try:
                details = get_job_details_by_ids(self.jobs_collection, job_ids_to_fetch, db=db)
                for rec in recommendations:
                    job_id = rec['job_id']
                    if job_id in details:
                        rec.update({
                            'title': details[job_id]['title'],
                            'description': details[job_id]['description'],
                            'company': details[job_id].get('company', 'N/A'),
                            'location': details[job_id].get('location', 'N/A')
                        })
            except Exception as e:
                print(f"Warning: Could not fetch job details: {e}")

        return recommendations
