# api.py

import pickle
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
import uvicorn
from job_recommender import pdf_extractor, text_preprocessing, recommender

app = FastAPI(title="Job Recommendation API")
recommender_obj = None

def get_recommender():
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
            raise Exception("Failed to load job recommender. " + str(e))
    return recommender_obj

@app.post("/recommend")
async def recommend_job(file: UploadFile = File(...)):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Uploaded file must be a PDF.")
    try:
        file_bytes = await file.read()
        extracted_text = pdf_extractor.extract_text_from_pdf(file_bytes)
        if not extracted_text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from PDF.")
        processed_text, candidate_entities = text_preprocessing.preprocess_text(extracted_text)
        rec = get_recommender()
        recommendations = rec.recommend(processed_text, candidate_entities)
        return JSONResponse(content={"recommendations": recommendations})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
