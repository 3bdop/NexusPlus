# api.py
import io
import pickle
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
import uvicorn

from job_recommender import pdf_extractor, text_preprocessing, recommender

app = FastAPI(title="Job Recommendation API")

# Global variable to cache the recommender
recommender_obj = None

def get_recommender():
    """
    Load the precomputed recommender from disk if not already loaded.
    """
    global recommender_obj
    if recommender_obj is None:
        try:
            with open('data/precomputed_index.pkl', 'rb') as f:
                precomputed = pickle.load(f)
            recommender_obj = recommender.JobRecommender(
                precomputed['job_postings'],
                job_embeddings=precomputed['job_embeddings'],
                index=precomputed['index']
            )
        except Exception as e:
            raise Exception("Failed to load job recommender. Error: " + str(e))
    return recommender_obj

@app.post("/recommend")
async def recommend_job(file: UploadFile = File(...)):
    """
    API endpoint to receive a PDF CV and return job recommendations.
    """
    # Check that the file is a PDF
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Uploaded file must be a PDF.")
    
    try:
        # Read the file bytes
        file_bytes = await file.read()
        
        # Extract text from the PDF
        extracted_text = pdf_extractor.extract_text_from_pdf(file_bytes)
        if not extracted_text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from PDF.")
        
        # Preprocess the text (cleaning, lemmatization, etc.)
        processed_text, _ = text_preprocessing.preprocess_text(extracted_text)
        
        # Get the recommender instance and produce recommendations
        rec = get_recommender()
        recommendations = rec.recommend(processed_text)
        
        # Return recommendations as JSON
        return JSONResponse(content={"recommendations": recommendations})
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
