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
    experience_level: str = Form(...),
    cv_path: Optional[str] = Form(None)  # Add cv_path parameter
):
    try:
        # Read and process CV
        cv_bytes = await cv_file.read()
        cv_text = extract_text_from_pdf(cv_bytes)
        processed_cv_text = process_cv_text(cv_text)
        
        # Extract skills and create embedding
        cv_skills = extract_skills_with_gemini(cv_text, GEMINI_API_KEY)
        cv_embedding = recommender.create_cv_embedding(processed_cv_text)

        # Store CV path in recommendations if provided
        recommendations = recommender.get_recommendations(
            cv_embedding=cv_embedding,
            user_experience=experience_level,
            user_skills=cv_skills,
            top_k=5,
            min_similarity=0.3,
            content_weight=0.7,
            experience_weight=0.2,
            skills_weight=0.1
        )

        # Add CV path to response if available
        response_data = {
            "status": "success",
            "recommendations": recommendations
        }
        if cv_path:
            response_data["cv_path"] = cv_path

        return response_data

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}