# scripts/save_job_to_csv.py

import json
import pandas as pd
import time
from tqdm import tqdm

from scripts.get_data import load_job_postings_from_csv
from src.domain.job.processor import embed_job_postings
from src.domain.job.ner import extract_job_skills_with_gemini
from src.config import GEMINI_API_KEY

def process_create_store_job_postings(
    input_csv='data/postings.csv',
    output_csv='data/processed_job_data.csv',
    gemini_api_key=None,
    request_delay=2
):
    """
    Process job postings, store in CSV with original data, skills, and embeddings.
    Includes rate limiting for Gemini API calls.
    """
    if not gemini_api_key:
        raise ValueError("Gemini API key is required for skills extraction")
    
    print("Loading job postings from CSV...")
    postings = load_job_postings_from_csv(input_csv)
    print(f"Loaded {len(postings)} postings.\n")

    # Limit to 500
    postings = postings[:50]
    print(f"Processing only {len(postings)} postings...\n")

    processed_jobs = []
    failed_jobs = []

    print("Extracting skills from postings...")
    print(f"Rate limiting: {request_delay} seconds between API calls")

    for posting in tqdm(postings, desc="Extracting skills"):
        try:
            skills = extract_job_skills_with_gemini(posting['description'], gemini_api_key)
            job_entry = {
                # Removed the "id" field as MongoDB will generate its own _id
                'title': posting['title'],
                'description': posting['description'],
                'experience': posting['experience'],
                'skills': json.dumps(skills),
            }
            processed_jobs.append(job_entry)
            time.sleep(request_delay)
        except Exception as e:
            print(f"\nError processing job {posting.get('id', 'unknown')}: {e}")
            failed_jobs.append({
                'error': str(e)
            })

    print(f"\nSkills extraction completed:")
    print(f"- Successfully processed: {len(processed_jobs)}")
    print(f"- Failed: {len(failed_jobs)}")

    if failed_jobs:
        print("\nFailed jobs:")
        for job in failed_jobs:
            print(f"- Job: unknown: {job['error']}")

    print("\nGenerating embeddings for postings...")
    postings_with_embeddings = embed_job_postings(processed_jobs)
    print("Finished generating embeddings.\n")

    df = pd.DataFrame(postings_with_embeddings)
    if 'embedding' in df.columns:
        df['embedding'] = df['embedding'].apply(lambda x: json.dumps(x))

    # Removed 'id' from the required columns since it is no longer used
    required_cols = ['title', 'description', 'experience', 'skills', 'embedding']
    for col in required_cols:
        if col not in df.columns:
            df[col] = None
    
    df = df[required_cols]
    df.to_csv(output_csv, index=False)
    print(f"Job postings have been saved to {output_csv}")

    sample_df = df.head(2)
    print("\nSample of processed data:")
    for _, row in sample_df.iterrows():
        print(f"\nTitle: {row['title']}")
        print(f"Experience: {row['experience']}")
        print(f"Skills: {json.loads(row['skills']) if pd.notna(row['skills']) else []}")
        print(f"Has Embedding: {bool(row['embedding'])}")

    return {
        'total_jobs': len(postings),
        'successful_jobs': len(processed_jobs),
        'failed_jobs': len(failed_jobs)
    }

if __name__ == "__main__":
    stats = process_create_store_job_postings(
        gemini_api_key=GEMINI_API_KEY,
        request_delay=2
    )
    print("\nProcess completed!")
    print(f"Total jobs processed: {stats['total_jobs']}")
    print(f"Successful: {stats['successful_jobs']}")
    print(f"Failed: {stats['failed_jobs']}")
