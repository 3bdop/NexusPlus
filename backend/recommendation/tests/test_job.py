# tests/test_job.py

from scripts.get_data import load_job_postings_from_csv
from src.domain.job.processor import process_job_postings, embed_job_postings
from src.domain.job.ner import extract_job_skills_with_gemini
from src.config import GEMINI_API_KEY

def test_process_job_postings():
    print("Step 1: Loading raw postings from CSV...")
    postings = load_job_postings_from_csv('data/postings.csv')
    print(f"Loaded {len(postings)} postings.\n")

    # Limit to 50 for demo
    postings = postings[:50]
    print(f"Processing only {len(postings)} postings...\n")

    print("Step 2: Processing job postings...")
    processed_postings = process_job_postings(postings)
    print("\nFinished processing.\n")

    print("Step 3: Sample of processed postings:")
    for idx, posting in enumerate(processed_postings[:5]):
        print(f"\nPosting {idx + 1}:")
        print(f"  Title: {posting['title']}")
        print(f"  Description: {posting['description']}")
        print(f"  Experience: {posting['experience']}")

    print("\nValidating processed postings...")
    assert len(processed_postings) > 0, "No postings were processed."
    for idx, posting in enumerate(processed_postings):
        assert 'title' in posting, f"Posting {idx} is missing 'title'."
        assert 'description' in posting, f"Posting {idx} is missing 'description'."
        assert 'experience' in posting, f"Posting {idx} is missing 'experience'."
    print("Processing tests passed!\n")
    return processed_postings

def test_embed_job_postings(processed_postings):
    print("Step 4: Embedding job postings...")
    postings_with_embeddings = embed_job_postings(processed_postings)
    print("\nFinished embedding.\n")

    print("Step 5: Sample embeddings (first 2 jobs):")
    for idx, posting in enumerate(postings_with_embeddings[:2]):
        emb = posting.get('embedding')
        print(f"\nJob #{idx + 1} Embedding length: {len(emb) if emb else 0}")
        # Optionally print a small part of the embedding:
        if emb:
            print(f"First 5 elements of embedding: {emb[:5]}")

    print("\nValidating embeddings...")
    for idx, posting in enumerate(postings_with_embeddings):
        assert 'embedding' in posting, f"Posting {idx} is missing 'embedding'."
        emb = posting['embedding']
        assert isinstance(emb, list), f"Embedding for posting {idx} should be a list."
        assert len(emb) > 0, f"Embedding for posting {idx} is empty."
    print("Embedding tests passed!\n")

def test_job_skills_extraction():
    print("\nTesting Job Skills Extraction")
    print("=" * 50)

    # Simple test scenarios
    test_jobs = {
        "Healthcare": {
            "title": "Registered Nurse - Emergency Department",
            "description": """
                Requirements:
                - Valid RN license
                - BLS and ACLS certification
                - 3+ years emergency nursing experience
                - Experience with Epic EMR system
                - Strong trauma care knowledge
                - IV therapy certification
                - Triage assessment skills
                - Knowledge of emergency medications
                - Experience with cardiac monitoring
            """
        },
        "Engineering": {
            "title": "Mechanical Engineer - Automotive",
            "description": """
                Requirements:
                - Bachelor's degree in Mechanical Engineering
                - Experience with CAD software (CATIA, SolidWorks)
                - Knowledge of GD&T principles
                - Finite element analysis
                - Automotive safety standards
                - Proficiency in thermal analysis
                - Prototype development
                - Manufacturing processes
            """
        }
    }

    if not GEMINI_API_KEY:
        print("No GEMINI_API_KEY found. Please set it in your .env and config.py.")
        return

    successful_extractions = 0
    total_jobs = len(test_jobs)

    for field, job_data in test_jobs.items():
        print(f"\nField: {field}")
        print(f"Job Title: {job_data['title']}")
        print("-" * 30)

        try:
            skills = extract_job_skills_with_gemini(job_data['description'], GEMINI_API_KEY)
            assert isinstance(skills, list), "Skills should be returned as a list."
            print("Extracted Skills:")
            for skill in skills:
                print(f" - {skill}")
            if skills:
                successful_extractions += 1
        except Exception as e:
            print(f"Error extracting skills: {e}")

    # Summary
    print("\nTest Summary:")
    print(f"  Processed {successful_extractions} out of {total_jobs} job descriptions.")
    assert successful_extractions > 0, "No jobs were successfully processed."
    print("Skill extraction tests passed!\n")

if __name__ == "__main__":
    # 1) Process & embed job postings
    processed = test_process_job_postings()
    test_embed_job_postings(processed)
    # 2) Test job skill extraction
    test_job_skills_extraction()
    print("\nAll tests completed!")
