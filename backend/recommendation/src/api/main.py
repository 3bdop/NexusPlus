from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
from bson import ObjectId
import io

from src.domain.cv.processor import extract_text_from_pdf, process_cv_text
from src.domain.cv.ner import extract_skills_with_gemini
from src.domain.recommendation.recommendation_service import JobRecommender
from src.utils.db_service import (
    connect_to_mongo,
    save_user_recommendations,
    get_job_details_by_ids,
    apply_to_job,
    store_user_cv_embedding
)
from src.config import GEMINI_API_KEY, MONGODB_URI, MONGODB_DB_NAME

app = FastAPI(title="Job Recommendation API")

# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://nexusplus.vercel.app", "http://localhost:5173"],  # Replace * with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize MongoDB connection and job recommender
db = connect_to_mongo(MONGODB_URI, MONGODB_DB_NAME)
jobs_collection = db["job"]
recommender = JobRecommender()
recommender.load_jobs(jobs_collection)

@app.post("/api/recommendations")
async def get_recommendations(
    cv_file: UploadFile = File(...),
    experience_level: str = Form(...),
    user_id: str = Form(...),
    cv_path: Optional[str] = Form(None)
):
    try:
        # Add some basic validation
        if not cv_file.filename.endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files are allowed")

        # Process the CV
        cv_bytes = await cv_file.read()
        cv_text = extract_text_from_pdf(cv_bytes)
        processed_cv_text = process_cv_text(cv_text)

        # Extract skills and create embedding
        cv_skills = extract_skills_with_gemini(cv_text, GEMINI_API_KEY)
        cv_embedding = recommender.create_cv_embedding(processed_cv_text)

        # Store the CV embedding in the user's document
        store_user_cv_embedding(db, user_id, cv_embedding)

        # Get job recommendations
        recommendations = recommender.get_recommendations(
            cv_embedding=cv_embedding,
            user_experience=experience_level,
            user_skills=cv_skills,
            top_k=5,
            min_similarity=0.3,
            content_weight=0.7,
            experience_weight=0.2,
            skills_weight=0.1,
            db=db if db is not None else None
        )

        # Debug: Print recommendations
        print(f"Recommendations before saving: {recommendations}")

        # Extract job IDs from recommendations and save them for the user
        job_ids = [rec['job_id'] for rec in recommendations]
        save_user_recommendations(db, user_id, job_ids)

        # Get job details in the same format as the GET endpoint
        job_details_dict = get_job_details_by_ids(jobs_collection, job_ids, current_user_id=user_id, db=db if db is not None else None)
        formatted_recommendations = [
            job_details_dict[job_id]
            for job_id in job_ids
            if job_id in job_details_dict
        ]

        print(f"Formatted recommendations: {formatted_recommendations}")

        response_data = {
            "status": "success",
            "recommendations": formatted_recommendations
        }
        if cv_path:
            response_data["cv_path"] = cv_path

        return response_data

    except Exception as e:
        print(f"Error processing recommendation request: {str(e)}")  # Add logging
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/recommendations")
async def get_existing_recommendations(user_id: str):
    """
    Retrieve saved recommended jobs for a user in the same order as initially recommended.
    Each job will include an 'applied' flag indicating whether the user has applied.
    """
    try:
        users_collection = db["users"]
        user_doc = users_collection.find_one({"_id": ObjectId(user_id)})
        if not user_doc:
            raise HTTPException(status_code=404, detail="User not found")
        recommended_job_ids = user_doc.get("recommended_jobs", [])
        if not recommended_job_ids:
            return {"status": "no recommendations", "recommendations": []}

        # Retrieve job details with applied flag using current user id
        print(f"Getting job details for IDs: {recommended_job_ids}")
        job_details_dict = get_job_details_by_ids(jobs_collection, recommended_job_ids, current_user_id=user_id, db=db if db is not None else None)
        print(f"Job details retrieved: {job_details_dict}")
        recommendations = [
            job_details_dict[job_id]
            for job_id in recommended_job_ids
            if job_id in job_details_dict
        ]
        print(f"Final recommendations: {recommendations}")

        return {"status": "success", "recommendations": recommendations}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/jobs/{job_id}/apply")
async def apply_to_job_endpoint(job_id: str, user_id: str):
    """
    Add the user's _id to the specified job's applicants array.
    """
    try:
        success = apply_to_job(db, job_id, user_id)
        if success:
            return {"status": "success", "message": "Applied successfully"}
        else:
            return {"status": "error", "message": "Could not apply to job (job might not exist or already updated)."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}

@app.get("/api/debug/companies")
async def debug_companies():
    """Debug endpoint to check the company collection structure."""
    try:
        company_collection = db["company"]
        companies = list(company_collection.find({}))

        # Convert ObjectId to string for JSON serialization
        formatted_companies = []
        for company in companies:
            company["_id"] = str(company["_id"])
            formatted_companies.append(company)

        return {"status": "success", "companies": formatted_companies, "count": len(formatted_companies)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends
# from fastapi.middleware.cors import CORSMiddleware
# from typing import Optional, List
# from bson import ObjectId
# import io
# from pydantic import BaseModel, Field

# # Domain imports
# from src.domain.cv.processor import extract_text_from_pdf, process_cv_text
# from src.domain.cv.ner import extract_skills_with_gemini
# from src.domain.recommendation.recommendation_service import JobRecommender
# from src.domain.recommendation.candidate_recommendation_service import CandidateRecommender

# # Utility imports
# from src.utils.db_service import (
#     connect_to_mongo,
#     save_user_recommendations,
#     get_job_details_by_ids,
#     apply_to_job,
#     store_user_cv_embedding
# )

# # Config
# from src.config import GEMINI_API_KEY, MONGODB_URI, MONGODB_DB_NAME

# # Initialize FastAPI
# app = FastAPI(title="Nexus+ Recommendation API")

# # CORS Configuration
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["https://nexusplus.vercel.app", "http://localhost:5173"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # Database initialization
# db = connect_to_mongo(MONGODB_URI, MONGODB_DB_NAME)
# jobs_collection = db["job"]
# users_collection = db["users"]

# # Initialize recommenders
# job_recommender = JobRecommender()
# job_recommender.load_jobs(jobs_collection)
# candidate_recommender = CandidateRecommender()
# candidate_recommender.initialize(users_collection, jobs_collection)

# # Pydantic models
# class CandidateBase(BaseModel):
#     candidate_id: str
#     name: str
#     email: str
#     experience: str
#     content_similarity: float
#     experience_match: float
#     skills_match: float
#     final_score: float
#     matching_skills: List[str]
#     all_skills: List[str]

# class RecommendationResponse(BaseModel):
#     job_id: str
#     job_title: str
#     job_experience: str
#     job_skills: List[str]
#     candidates: List[CandidateBase]

# # ================== Job Seeker Endpoints ==================
# @app.post("/api/recommendations")
# async def get_job_recommendations(
#     cv_file: UploadFile = File(...),
#     experience_level: str = Form(...),
#     user_id: str = Form(...),
#     cv_path: Optional[str] = Form(None)
# ):
#     try:
#         if not cv_file.filename.endswith('.pdf'):
#             raise HTTPException(status_code=400, detail="Only PDF files are allowed")

#         cv_bytes = await cv_file.read()
#         cv_text = extract_text_from_pdf(cv_bytes)
#         processed_cv_text = process_cv_text(cv_text)
#         cv_skills = extract_skills_with_gemini(cv_text, GEMINI_API_KEY)
#         cv_embedding = job_recommender.create_cv_embedding(processed_cv_text)

#         store_user_cv_embedding(db, user_id, cv_embedding)

#         recommendations = job_recommender.get_recommendations(
#             cv_embedding=cv_embedding,
#             user_experience=experience_level,
#             user_skills=cv_skills,
#             top_k=5,
#             min_similarity=0.3,
#             content_weight=0.7,
#             experience_weight=0.2,
#             skills_weight=0.1,
#             db=db
#         )

#         job_ids = [rec['job_id'] for rec in recommendations]
#         save_user_recommendations(db, user_id, job_ids)
#         job_details_dict = get_job_details_by_ids(jobs_collection, job_ids, current_user_id=user_id, db=db)
        
#         formatted_recommendations = [
#             job_details_dict[job_id]
#             for job_id in job_ids
#             if job_id in job_details_dict
#         ]

#         response_data = {
#             "status": "success",
#             "recommendations": formatted_recommendations
#         }
#         if cv_path:
#             response_data["cv_path"] = cv_path

#         return response_data
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))

# @app.get("/api/recommendations")
# async def get_existing_recommendations(user_id: str):
#     try:
#         user_doc = users_collection.find_one({"_id": ObjectId(user_id)})
#         if not user_doc:
#             raise HTTPException(status_code=404, detail="User not found")
        
#         recommended_job_ids = user_doc.get("recommended_jobs", [])
#         job_details_dict = get_job_details_by_ids(jobs_collection, recommended_job_ids, current_user_id=user_id, db=db)
        
#         return {
#             "status": "success",
#             "recommendations": [
#                 job_details_dict[job_id]
#                 for job_id in recommended_job_ids
#                 if job_id in job_details_dict
#             ]
#         }
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))

# # ================== Employer Endpoints ==================
# @app.get("/api/employer/recommendations/{job_id}", response_model=RecommendationResponse)
# async def get_candidate_recommendations(
#     job_id: str,
#     top_k: Optional[int] = 1,
#     min_similarity: Optional[float] = 0.3
# ):
#     try:
#         job = jobs_collection.find_one({"_id": ObjectId(job_id)})
#         if not job:
#             raise HTTPException(status_code=404, detail=f"Job {job_id} not found")

#         recommendations = candidate_recommender.recommend_candidates(
#             job_id=job_id,
#             top_k=top_k,
#             min_similarity=min_similarity
#         )

#         return {
#             "job_id": job_id,
#             "job_title": job.get("title", "Unknown Job"),
#             "job_experience": job.get("experience", "Not specified"),
#             "job_skills": job.get("skills", []),
#             "candidates": recommendations
#         }
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))

# # ================== Common Endpoints ==================
# @app.post("/api/jobs/{job_id}/apply")
# async def apply_to_job_endpoint(job_id: str, user_id: str):
#     try:
#         success = apply_to_job(db, job_id, user_id)
#         return {"status": "success" if success else "error"}
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))

# @app.get("/api/health")
# async def health_check():
#     return {"status": "healthy"}

# @app.get("/api/job/{job_id}/applicants")
# async def get_job_applicants(job_id: str):
#     try:
#         job = jobs_collection.find_one({"_id": ObjectId(job_id)})
#         if not job:
#             raise HTTPException(status_code=404, detail="Job not found")
        
#         applicants = job.get("applicants", [])
#         return {
#             "job_id": job_id,
#             "applicant_count": len(applicants),
#             "applicants": applicants
#         }
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))

# # ================== Debug Endpoints ==================
# @app.get("/api/debug/companies")
# async def debug_companies():
#     try:
#         company_collection = db["company"]
#         companies = list(company_collection.find({}))
#         return {"status": "success", "companies": companies}
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))



