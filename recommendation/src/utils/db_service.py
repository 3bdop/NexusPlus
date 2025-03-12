# src/utils/db_service.py

import logging
from bson import ObjectId
from pymongo import MongoClient

def connect_to_mongo(uri: str, db_name: str):
    """
    Connect to the MongoDB database using the provided URI and database name.
    """
    try:
        client = MongoClient(uri)
        db = client[db_name]
        logging.info(f"Successfully connected to MongoDB database: {db_name}")
        return db
    except Exception as e:
        logging.error("Error connecting to MongoDB: %s", e)
        raise

def get_all_job_embeddings(jobs_collection):
    """
    Retrieve all job embeddings along with their ID and required experience.
    """
    cursor = jobs_collection.find({}, {"_id": 1, "embedding": 1, "experience": 1})
    job_list = []
    for doc in cursor:
        job = {
            "id": str(doc.get("_id")),  # Convert ObjectId to string
            "embedding": doc.get("embedding"),
            "experience": doc.get("experience")
        }
        job_list.append(job)
    return job_list

def get_job_details_by_ids(jobs_collection, job_ids: list) -> dict:
    """
    Retrieve detailed job information for specific job IDs.
    """
    object_ids = [ObjectId(id_) for id_ in job_ids]
    cursor = jobs_collection.find(
        {"_id": {"$in": object_ids}},
        {
            "_id": 1,
            "title": 1,
            "description": 1,
            "experience": 1,
            # Add other fields if needed, e.g. company, location
        }
    )
    
    job_details = {}
    for doc in cursor:
        job_id = str(doc["_id"])
        job_details[job_id] = {
            "title": doc.get("title", "N/A"),
            "description": doc.get("description", "N/A"),
            "experience": doc.get("experience", "N/A"),
            # Add other fields if needed
        }
    return job_details

def get_job_skills_by_ids(jobs_collection, job_ids: list) -> dict:
    """
    Retrieve skills required for specific job IDs.
    """
    object_ids = [ObjectId(id_) for id_ in job_ids]
    cursor = jobs_collection.find(
        {"_id": {"$in": object_ids}},
        {"_id": 1, "skills": 1}
    )
    
    job_skills = {}
    for doc in cursor:
        job_id = str(doc["_id"])
        # doc.get("skills", []) is usually a list or JSON if stored
        job_skills[job_id] = doc.get("skills", [])
    return job_skills
