from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from bson import ObjectId
from pydantic import BaseModel, Field

from src.domain.recommendation.candidate_recommendation_service import CandidateRecommender
from src.utils.db_service import connect_to_mongo
from src.config import MONGODB_URI, MONGODB_DB_NAME

app = FastAPI(title="Candidate Recommendation API")

# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://nexusplus.vercel.app"],  # Change this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize MongoDB connection and candidate recommender
db = connect_to_mongo(MONGODB_URI, MONGODB_DB_NAME)
users_collection = db["users"]
jobs_collection = db["job"]
candidate_recommender = CandidateRecommender()
candidate_recommender.initialize(users_collection, jobs_collection)

# Define response models
class CandidateBase(BaseModel):
    candidate_id: str
    name: str
    email: str
    experience: str
    content_similarity: float
    experience_match: float
    skills_match: float
    final_score: float
    matching_skills: List[str]
    all_skills: List[str]

class RecommendationResponse(BaseModel):
    job_id: str
    job_title: str
    job_experience: str
    job_skills: List[str]
    candidates: List[CandidateBase]

@app.get("/")
async def read_root():
    return {"message": "Welcome to the Candidate Recommendation API"}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}

@app.get("/api/recommendations/{job_id}", response_model=RecommendationResponse)
async def get_candidate_recommendations(
    job_id: str,
    top_k: Optional[int] = 1,  # Changed default to 1 to only return the top candidate
    min_similarity: Optional[float] = 0.3  # Lowered default threshold
):
    """
    Get top candidate recommendations for a specific job.
    """
    print(f"\n\n==== API Request: Get recommendations for job {job_id} ====\n")
    print(f"Parameters: top_k={top_k}, min_similarity={min_similarity}")

    try:
        # Validate job ID
        job = jobs_collection.find_one({"_id": ObjectId(job_id)})
        if not job:
            print(f"Job with ID {job_id} not found")
            raise HTTPException(status_code=404, detail=f"Job with ID {job_id} not found")

        print(f"Found job: {job.get('title', 'Unknown Job')}")

        # Check if job has applicants
        applicants = job.get('applicants', [])
        print(f"Job has {len(applicants)} applicants")

        if not applicants:
            print("No applicants found for this job. Returning empty response.")
            return {
                "job_id": job_id,
                "job_title": job.get("title", "Unknown Job"),
                "job_experience": job.get("experience", "Not specified"),
                "job_skills": job.get("skills", []),
                "candidates": []
            }

        # Get candidate recommendations
        try:
            recommendations = candidate_recommender.recommend_candidates(
                job_id=job_id,
                top_k=top_k,
                min_similarity=min_similarity
            )
            print(f"Got {len(recommendations)} recommendations from recommender")
        except ValueError as val_error:
            # Handle specific value errors (like missing embeddings)
            print(f"Value error in recommendation process: {val_error}")
            print("Returning empty recommendations list with error message")
            return {
                "job_id": job_id,
                "job_title": job.get("title", "Unknown Job"),
                "job_experience": job.get("experience", "Not specified"),
                "job_skills": job.get("skills", []),
                "candidates": [],
                "error": str(val_error)
            }
        except Exception as rec_error:
            print(f"Error getting recommendations: {rec_error}")
            print("Returning empty recommendations list")
            recommendations = []

        # Return formatted response
        response = {
            "job_id": job_id,
            "job_title": job.get("title", "Unknown Job"),
            "job_experience": job.get("experience", "Not specified"),
            "job_skills": job.get("skills", []),
            "candidates": recommendations
        }
        print(f"Returning response with {len(recommendations)} candidates")
        return response
    except ValueError as e:
        print(f"ValueError: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@app.get("/api/job/{job_id}/applicants")
async def get_job_applicants(job_id: str):
    """
    Get all applicants for a specific job.
    """
    try:
        # Validate job ID
        job = jobs_collection.find_one(
            {"_id": ObjectId(job_id)},
            {"applicants": 1, "title": 1}
        )
        if not job:
            raise HTTPException(status_code=404, detail=f"Job with ID {job_id} not found")

        applicants = job.get("applicants", [])
        if not applicants:
            return {
                "job_id": job_id,
                "job_title": job.get("title", "Unknown Job"),
                "applicant_count": 0,
                "applicants": []
            }

        # Get applicant details
        applicant_details = []
        for applicant_id in applicants:
            user = users_collection.find_one(
                {"_id": applicant_id},
                {"_id": 1, "name": 1, "email": 1, "experience": 1, "skills": 1}
            )
            if user:
                applicant_details.append({
                    "id": str(user["_id"]),
                    "name": user.get("name", "Unknown"),
                    "email": user.get("email", "No email"),
                    "experience": user.get("experience", "Not specified"),
                    "skills": user.get("skills", [])
                })

        return {
            "job_id": job_id,
            "job_title": job.get("title", "Unknown Job"),
            "applicant_count": len(applicant_details),
            "applicants": applicant_details
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@app.get("/api/candidate/{candidate_id}/matches")
async def get_candidate_job_matches(
    candidate_id: str,
    top_k: Optional[int] = 5
):
    """
    Get job matches for a specific candidate based on their CV.
    """
    try:
        # Validate candidate ID
        user = users_collection.find_one({"_id": ObjectId(candidate_id)})
        if not user:
            raise HTTPException(status_code=404, detail=f"User with ID {candidate_id} not found")

        if "cv_embedding" not in user:
            raise HTTPException(status_code=400, detail="This user does not have a CV embedding")

        # Get all jobs that this candidate has applied to
        applied_jobs = list(jobs_collection.find(
            {"applicants": ObjectId(candidate_id)},
            {"_id": 1, "title": 1, "experience": 1, "skills": 1, "embedding": 1}
        ))

        if not applied_jobs:
            return {
                "candidate_id": candidate_id,
                "candidate_name": user.get("name", "Unknown"),
                "job_count": 0,
                "jobs": []
            }

        # Get candidate's CV embedding and details
        cv_embedding = user.get("cv_embedding")
        user_skills = user.get("skills", [])
        user_experience = user.get("experience", "entry level")

        # Calculate match scores for each job
        job_matches = []
        for job in applied_jobs:
            # Skip jobs without embeddings
            if "embedding" not in job:
                continue

            job_id = str(job["_id"])
            job_embedding = job["embedding"]
            job_skills = job.get("skills", [])
            job_experience = job.get("experience", "entry level")

            # Calculate similarity scores
            import numpy as np
            from sklearn.metrics.pairwise import cosine_similarity

            # Content similarity
            job_embedding_array = np.array(job_embedding)
            cv_embedding_array = np.array(cv_embedding)
            content_similarity = float(cosine_similarity([cv_embedding_array], [job_embedding_array])[0][0])

            # Experience and skills match
            experience_match = candidate_recommender.calculate_experience_match_score(
                user_experience, job_experience
            )
            skills_match = candidate_recommender.calculate_skills_match_score(
                user_skills, job_skills
            )

            # Overall score (using default weights)
            final_score = (content_similarity * 0.6) + (experience_match * 0.2) + (skills_match * 0.2)

            # Get matching skills
            user_skills_norm = [s.lower().strip() for s in user_skills]
            job_skills_norm = [s.lower().strip() for s in job_skills]
            matching_skills = list(set(user_skills_norm) & set(job_skills_norm))

            job_matches.append({
                "job_id": job_id,
                "title": job.get("title", "Unknown Job"),
                "content_similarity": float(content_similarity),
                "experience_match": float(experience_match),
                "skills_match": float(skills_match),
                "final_score": float(final_score),
                "experience": job.get("experience", "Not specified"),
                "matching_skills": matching_skills,
                "required_skills": job_skills
            })

        # Sort by final score
        job_matches.sort(key=lambda x: x["final_score"], reverse=True)

        # Return top matches
        return {
            "candidate_id": candidate_id,
            "candidate_name": user.get("name", "Unknown"),
            "job_count": len(job_matches),
            "jobs": job_matches[:top_k]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")
