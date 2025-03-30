# tests/test_db.py

from src.utils.db_service import connect_to_mongo, get_all_job_embeddings, get_job_details_by_ids
from src.config import MONGODB_URI, MONGODB_DB_NAME

def main():
    try:
        db = connect_to_mongo(MONGODB_URI, MONGODB_DB_NAME)
        print(f"Successfully connected to {MONGODB_DB_NAME}")
    except Exception as e:
        print(f"Failed to connect: {e}")
        return

    jobs_collection = db["job"]

    try:
        job_embeddings = get_all_job_embeddings(jobs_collection)
        print(f"Retrieved {len(job_embeddings)} job embeddings.")
        if job_embeddings:
            for job in job_embeddings[:3]:
                print(f"  Job ID: {job['id']}, Experience: {job['experience']}")
    except Exception as e:
        print(f"Error retrieving job embeddings: {e}")
        return

    try:
        if job_embeddings:
            sample_ids = [job["id"] for job in job_embeddings[:2]]
            job_details = get_job_details_by_ids(jobs_collection, sample_ids)
            print("\nTesting get_job_details_by_ids:")
            for job_id, details in job_details.items():
                print(f"  {job_id} => Title: {details.get('title')} - Experience: {details.get('experience')}")
                
    except Exception as e:
        print(f"Error retrieving job details: {e}")

if __name__ == "__main__":
    main()
