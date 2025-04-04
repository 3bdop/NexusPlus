import logging
from bson import ObjectId
from pymongo import MongoClient
import numpy as np  # Needed to check for numpy arrays

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

def get_job_details_by_ids(jobs_collection, job_ids: list, current_user_id: str = None, db=None) -> dict:
    """
    Retrieve detailed job information for specific job IDs.
    Returns a dict keyed by job id (as a string).
    If current_user_id is provided, adds an 'applied' flag (True/False)
    based on whether the user's ObjectId is present in the 'applicants' field.
    If db is provided, looks up company names from the company collection.
    """
    object_ids = [ObjectId(id_) for id_ in job_ids]
    cursor = jobs_collection.find(
        {"_id": {"$in": object_ids}},
        {
            "_id": 1,
            "title": 1,
            "description": 1,
            "experience": 1,
            "company": 1,
            "company_id": 1,
            "applicants": 1  # Include applicants for checking applied status
        }
    )

    # Create a dictionary to store company names by company_id
    company_names = {}
    if db is not None:
        # Get all unique company_ids from the jobs
        company_ids = set()
        jobs_list = list(cursor)
        print(f"Found {len(jobs_list)} jobs to process")
        for job in jobs_list:
            if "company_id" in job and job["company_id"]:
                company_ids.add(job["company_id"])
                print(f"Added company_id: {job['company_id']}")

        # Look up company names if there are any company_ids
        if company_ids:
            try:
                company_collection = db["company"]
                print(f"Looking up company names for {len(company_ids)} companies")
                company_ids_list = list(company_ids)
                print(f"Company IDs to look up: {company_ids_list}")

                # Convert string IDs to ObjectId if needed
                object_company_ids = []
                for company_id in company_ids_list:
                    if isinstance(company_id, str):
                        try:
                            object_company_ids.append(ObjectId(company_id))
                        except Exception as e:
                            print(f"Error converting company_id {company_id} to ObjectId: {e}")
                            object_company_ids.append(company_id)
                    else:
                        object_company_ids.append(company_id)

                print(f"Converted company IDs: {object_company_ids}")

                # First try with ObjectId
                company_cursor = company_collection.find(
                    {"_id": {"$in": object_company_ids}},
                    {"_id": 1, "company_name": 1}
                )

                companies_list = list(company_cursor)
                print(f"Found {len(companies_list)} companies with ObjectId lookup")

                if not companies_list:
                    # Try with string IDs as fallback
                    print("Trying string ID lookup as fallback")
                    company_cursor = company_collection.find(
                        {"_id": {"$in": company_ids_list}},
                        {"_id": 1, "company_name": 1}
                    )
                    companies_list = list(company_cursor)
                    print(f"Found {len(companies_list)} companies with string ID lookup")

                # Print all companies in the collection for debugging
                all_companies = list(company_collection.find({}, {"_id": 1, "company_name": 1}))
                print(f"Total companies in collection: {len(all_companies)}")
                for company in all_companies:
                    print(f"Company in DB: {company['_id']} -> {company.get('company_name', 'N/A')}")

                for company in companies_list:
                    company_names[str(company["_id"])] = company.get("company_name", "N/A")
                    print(f"Found company: {company['_id']} -> {company.get('company_name', 'N/A')}")

                print(f"Loaded {len(company_names)} company names")
            except Exception as e:
                logging.error(f"Error fetching company names: {e}")
                print(f"Error fetching company names: {e}")

        # Reset cursor for job processing
        cursor = jobs_list

    job_details = {}
    for doc in cursor:
        job_id = str(doc["_id"])
        print(f"Processing job: {job_id}")
        applied = False
        if current_user_id:
            try:
                applied = ObjectId(current_user_id) in doc.get("applicants", [])
            except Exception as e:
                applied = False

        # Get company name from company_names dictionary if available
        company_name = "N/A"
        if "company_id" in doc and doc["company_id"]:
            company_id_str = str(doc["company_id"])
            company_id_obj = doc["company_id"]
            print(f"Job {job_id} has company_id: {company_id_str}")

            # Try to get from pre-loaded company names
            if company_id_str in company_names:
                company_name = company_names[company_id_str]
                print(f"Found company name: {company_name} for job {job_id}")
            else:
                print(f"Company ID {company_id_str} not found in company_names dictionary")

                # Try direct lookup if db is available
                if db is not None:
                    try:
                        print(f"Trying direct lookup for company ID: {company_id_str}")
                        company_collection = db["company"]

                        # Try with ObjectId
                        company = company_collection.find_one({"_id": company_id_obj})
                        if company and "company_name" in company:
                            company_name = company["company_name"]
                            print(f"Direct lookup found company name: {company_name}")
                        else:
                            # Try with string ID
                            company = company_collection.find_one({"_id": company_id_str})
                            if company and "company_name" in company:
                                company_name = company["company_name"]
                                print(f"Direct string lookup found company name: {company_name}")
                            else:
                                print(f"Direct lookup failed for company ID: {company_id_str}")
                    except Exception as e:
                        print(f"Error in direct company lookup: {e}")
        elif "company" in doc and doc["company"]:
            company_name = doc["company"]
            print(f"Using company field directly: {company_name} for job {job_id}")
        else:
            print(f"No company information found for job {job_id}")

        job_details[job_id] = {
            "_id": job_id,
            "title": doc.get("title", "N/A"),
            "description": doc.get("description", "N/A"),
            "experience": doc.get("experience", "N/A"),
            "company": company_name,
            "applied": applied
        }
        print(f"Added job details: {job_details[job_id]}")
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
        job_skills[job_id] = doc.get("skills", [])
    return job_skills

def save_user_recommendations(db, user_id: str, job_ids: list):
    """
    Save recommended job IDs to user's document.
    """
    users_collection = db["users"]
    try:
        result = users_collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"recommended_jobs": job_ids}}
        )
        return result.modified_count > 0
    except Exception as e:
        logging.error(f"Error saving recommendations: {e}")
        return False

def store_user_cv_embedding(db, user_id: str, cv_embedding):
    """
    Store the CV embedding in the user's document.
    Converts the embedding to a list if it is a NumPy array.
    """
    users_collection = db["users"]
    try:
        # Convert cv_embedding to a list if it's a NumPy array
        if isinstance(cv_embedding, np.ndarray):
            cv_embedding = cv_embedding.tolist()
        result = users_collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"cv_embedding": cv_embedding}}
        )
        return result.modified_count > 0
    except Exception as e:
        logging.error(f"Error storing CV embedding: {e}")
        return False

def apply_to_job(db, job_id: str, user_id: str) -> bool:
    """
    Add the user_id to the job's 'applicants' array (creates the field if it doesn't exist).
    """
    jobs_collection = db["job"]
    try:
        result = jobs_collection.update_one(
            {"_id": ObjectId(job_id)},
            {"$addToSet": {"applicants": ObjectId(user_id)}}
        )
        return result.modified_count > 0
    except Exception as e:
        logging.error(f"Error applying to job: {e}")
        return False
