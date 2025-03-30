# src/domain/recommendation/candidate_recommendation_service.py

import numpy as np
from typing import List, Dict
from bson import ObjectId
from sklearn.metrics.pairwise import cosine_similarity

from src.utils.db_service import get_job_skills_by_ids


class CandidateRecommender:
    def __init__(self):
        self.users_collection = None
        self.jobs_collection = None

    def initialize(self, users_collection, jobs_collection) -> None:
        """Initialize with MongoDB collections."""
        self.users_collection = users_collection
        self.jobs_collection = jobs_collection
        print("Candidate recommender initialized with database collections")
        
    def get_job_embedding(self, job_id: str) -> np.ndarray:
        """Retrieve embedding for a specific job from the database."""
        job = self.jobs_collection.find_one(
            {"_id": ObjectId(job_id)},
            {"embedding": 1}
        )
        if not job or "embedding" not in job:
            raise ValueError(f"Job with ID {job_id} not found or has no embedding")
        return np.array(job["embedding"])
    
    def get_job_required_skills(self, job_id: str) -> list:
        """Get skills required for a specific job."""
        skills_dict = get_job_skills_by_ids(self.jobs_collection, [job_id])
        return skills_dict.get(job_id, [])
    
    def get_job_experience_level(self, job_id: str) -> str:
        """Get experience level required for a specific job."""
        job = self.jobs_collection.find_one(
            {"_id": ObjectId(job_id)},
            {"experience": 1}
        )
        if not job:
            return "entry level"
        return job.get("experience", "entry level")
    
    def get_applicants_for_job(self, job_id: str) -> List[Dict]:
        """Get all users who applied for a specific job."""
        job = self.jobs_collection.find_one(
            {"_id": ObjectId(job_id)},
            {"applicants": 1}
        )
        
        if not job or "applicants" not in job or not job["applicants"]:
            return []
        
        applicant_ids = job["applicants"]
        applicants = []
        
        cursor = self.users_collection.find(
            {"_id": {"$in": applicant_ids}},
            {
                "_id": 1,
                "cv_embedding": 1,
                "skills": 1,
                "experience": 1,
                "name": 1,
                "email": 1
            }
        )
        
        for user in cursor:
            if "cv_embedding" not in user:
                continue  # Skip users without CV embeddings
                
            applicants.append({
                "id": str(user["_id"]),
                "embedding": user["cv_embedding"],
                "skills": user.get("skills", []),
                "experience": user.get("experience", "entry level"),
                "name": user.get("name", "Unknown"),
                "email": user.get("email", "No email")
            })
            
        return applicants
    
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
            
        # For candidates, slightly favor more experienced candidates
        if user_level >= job_level:
            if user_level - job_level <= 1:
                return 1.0  # Perfect match or slightly more experienced
            elif user_level - job_level == 2:
                return 0.8  # More experienced than required
            else:
                return 0.6  # Much more experienced
        else:
            diff = job_level - user_level
            if diff == 1:
                return 0.5  # Slightly less experience
            elif diff == 2:
                return 0.2  # Significantly less experience
            else:
                return 0.1  # Far less experience
    
    def calculate_skills_match_score(self, user_skills: list, job_skills: list) -> float:
        """
        Calculate similarity score between user skills and job required skills.
        """
        if not user_skills or not job_skills:
            return 0.5
        
        user_skills_norm = [s.lower().strip() for s in user_skills]
        job_skills_norm = [s.lower().strip() for s in job_skills]
        matching_skills = set(user_skills_norm) & set(job_skills_norm)
        
        # For candidates, job coverage is more important than diversity of skills
        job_coverage = len(matching_skills) / len(job_skills_norm)
        user_coverage = len(matching_skills) / len(user_skills_norm)

        # Weighing job coverage higher for candidate recommendation
        return (0.8 * job_coverage) + (0.2 * user_coverage)

    def recommend_candidates(
        self,
        job_id: str,
        top_k: int = 5,
        min_similarity: float = 0.5,
        content_weight: float = 0.6,
        experience_weight: float = 0.2,
        skills_weight: float = 0.2
    ) -> List[Dict]:
        """
        Get candidate recommendations for a specific job.
        """
        if self.users_collection is None or self.jobs_collection is None:
            raise ValueError("Recommender has not been initialized with collections")
        
        # Get job embedding and required skills
        try:
            job_embedding = self.get_job_embedding(job_id)
            job_skills = self.get_job_required_skills(job_id)
            job_experience = self.get_job_experience_level(job_id)
        except Exception as e:
            raise ValueError(f"Error retrieving job data: {e}")
        
        # Get applicants for the job
        applicants = self.get_applicants_for_job(job_id)
        if not applicants:
            return []
        
        # Prepare applicant embeddings for similarity calculation
        applicant_vectors = np.array([applicant['embedding'] for applicant in applicants])
        content_similarities = cosine_similarity([job_embedding], applicant_vectors)[0]
        
        # Calculate final scores
        final_scores = []
        for idx, content_score in enumerate(content_similarities):
            applicant = applicants[idx]
            
            # Calculate experience match
            experience_score = self.calculate_experience_match_score(
                applicant.get('experience', 'entry level'),
                job_experience
            )
            
            # Calculate skills match
            skills_score = self.calculate_skills_match_score(
                applicant.get('skills', []),
                job_skills
            )
            
            # Calculate final weighted score
            final_score = (
                (content_score * content_weight) +
                (experience_score * experience_weight) +
                (skills_score * skills_weight)
            )
            
            final_scores.append(final_score)
        
        # Get top candidates
        final_scores = np.array(final_scores)
        top_indices = np.argsort(final_scores)[-top_k:][::-1]
        
        # Prepare and return recommendations
        recommendations = []
        for idx in top_indices:
            if final_scores[idx] < min_similarity:
                continue
                
            applicant = applicants[idx]
            
            recommendations.append({
                'candidate_id': applicant['id'],
                'name': applicant['name'],
                'email': applicant['email'],
                'content_similarity': float(content_similarities[idx]),
                'experience_match': float(self.calculate_experience_match_score(
                    applicant.get('experience', 'entry level'),
                    job_experience
                )),
                'skills_match': float(self.calculate_skills_match_score(
                    applicant.get('skills', []),
                    job_skills
                )),
                'final_score': float(final_scores[idx]),
                'experience': applicant.get('experience', 'Not specified'),
                'matching_skills': list(set(applicant.get('skills', [])) & set(job_skills)),
                'all_skills': applicant.get('skills', [])
            })
        
        return recommendations
