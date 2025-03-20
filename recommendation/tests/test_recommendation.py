# tests/test_recommendation.py

from src.domain.recommendation.recommendation_service import JobRecommender
from src.domain.cv.processor import extract_text_from_pdf, process_cv_text
from src.domain.cv.ner import extract_skills_with_gemini
from src.utils.db_service import connect_to_mongo
from src.config import GEMINI_API_KEY, MONGODB_URI, MONGODB_DB_NAME

def get_user_experience_level():
    valid_levels = ["entry level", "associate", "mid level", "senior", "executive"]
    print("\nExperience levels:")
    for i, level in enumerate(valid_levels, 1):
        print(f"{i}. {level}")

    while True:
        try:
            choice = int(input("\nEnter the number corresponding to your experience level (1-5): "))
            if 1 <= choice <= len(valid_levels):
                return valid_levels[choice - 1]
        except ValueError:
            pass
        print("Invalid choice. Please try again.")

def load_and_process_cv(cv_path: str):
    try:
        with open(cv_path, 'rb') as file:
            cv_bytes = file.read()
        cv_text = extract_text_from_pdf(cv_bytes)
        processed_cv_text = process_cv_text(cv_text)
        cv_skills = extract_skills_with_gemini(cv_text, GEMINI_API_KEY)
        return processed_cv_text, cv_skills
    except Exception as e:
        print(f"Error processing CV: {e}")
        return None, None

def test_job_recommender():
    print("="*50)
    print("Interactive Job Recommendation Test")
    print("="*50)

    cv_path = input("Enter the path to your CV (PDF format): ")
    user_experience = get_user_experience_level()

    processed_cv_text, cv_skills = load_and_process_cv(cv_path)
    if not processed_cv_text or not cv_skills:
        print("Could not process CV. Exiting.")
        return

    print("\nConnecting to MongoDB...")
    try:
        db = connect_to_mongo(MONGODB_URI, MONGODB_DB_NAME)
        jobs_collection = db["job"]
    except Exception as e:
        print(f"Failed to connect to MongoDB: {e}")
        return

    recommender = JobRecommender()
    recommender.load_jobs(jobs_collection)
    cv_embedding = recommender.create_cv_embedding(processed_cv_text)

    while True:
        try:
            num_recs = int(input("\nHow many job recommendations would you like? (1-10): "))
            if 1 <= num_recs <= 10:
                break
        except ValueError:
            pass
        print("Invalid input. Please enter a number from 1 to 10.")

    recs = recommender.get_recommendations(
        cv_embedding=cv_embedding,
        user_experience=user_experience,
        user_skills=cv_skills,
        top_k=num_recs,
        min_similarity=0.3,
        content_weight=0.4,
        experience_weight=0.3,
        skills_weight=0.3
    )

    print("\n============================")
    print(f"Top {num_recs} Job Recommendations")
    print("============================")
    if not recs:
        print("No matching jobs found.")
    else:
        for i, rec in enumerate(recs, 1):
            print(f"\nRecommendation #{i}")
            print("-" * 25)
            print(f"Job Title: {rec.get('title', 'N/A')}")
            print(f"Required Experience: {rec.get('experience', 'N/A')}")
            print(f"Match Scores:")
            print(f"  Content Similarity: {rec['content_similarity']:.3f}")
            print(f"  Experience Match: {rec['experience_match']:.3f}")
            print(f"  Skills Match: {rec['skills_match']:.3f}")
            print(f"  Overall Score: {rec['final_score']:.3f}")
            if 'matching_skills' in rec:
                print("Matching Skills:", rec['matching_skills'])
            missing_skills = set(rec['required_skills']) - set(cv_skills)
            if missing_skills:
                print("Additional Required Skills:", missing_skills)

if __name__ == "__main__":
    test_job_recommender()
