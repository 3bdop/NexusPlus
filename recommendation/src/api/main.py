from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
import io

from src.domain.cv.processor import extract_text_from_pdf, process_cv_text, get_cv_embedding
from src.domain.cv.ner import extract_skills_with_gemini
from src.domain.recommendation.recommendation_service import JobRecommender
from src.utils.db_service import connect_to_mongo
from src.config import GEMINI_API_KEY, MONGODB_URI, MONGODB_DB_NAME

app = FastAPI(title="Job Recommendation API")

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize MongoDB connection and recommender
db = connect_to_mongo(MONGODB_URI, MONGODB_DB_NAME)
jobs_collection = db["job"]
recommender = JobRecommender()
recommender.load_jobs(jobs_collection)

@app.post("/api/recommendations")
async def get_recommendations(
    cv_file: UploadFile = File(...),
    experience_level: str = Form(...)
):
    try:
        # Read and process CV
        cv_bytes = await cv_file.read()
        cv_text = extract_text_from_pdf(cv_bytes)
        processed_cv_text = process_cv_text(cv_text)
        
        # Extract skills and create embedding
        cv_skills = extract_skills_with_gemini(cv_text, GEMINI_API_KEY)
        cv_embedding = recommender.create_cv_embedding(processed_cv_text)

        # Get recommendations with default parameters
        recommendations = recommender.get_recommendations(
            cv_embedding=cv_embedding,
            user_experience=experience_level,
            user_skills=cv_skills,
            top_k=5,
            min_similarity=0.3,
            content_weight=0.4,
            experience_weight=0.3,
            skills_weight=0.3
        )

        # Ensure recommendations have the correct structure
        formatted_recommendations = []
        for job in recommendations:
            formatted_recommendations.append({
                "title": job.get("title", "No Title"),
                "company": job.get("company", "No Company"),
                "experience": job.get("experience", "Not specified"),
                "skills": job.get("skills", []),
                "description": job.get("description", "No description available")
            })

        return {
            "status": "success",
            "recommendations": formatted_recommendations,
            "extracted_skills": cv_skills if isinstance(cv_skills, list) else []
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}