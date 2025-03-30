# tests/test_candidate_recommendation.py

import sys
import os
import numpy as np
import json
from pymongo import MongoClient
from bson import ObjectId

# Add the parent directory to the sys.path to import project modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.config import MONGODB_URI, MONGODB_DB_NAME
from src.domain.recommendation.candidate_recommendation_service import CandidateRecommender
from src.utils.db_service import connect_to_mongo
from src.domain.cv.processor import get_cv_embedding

def create_mock_applicant(name, experience, skills, cv_text):
    """Create a mock applicant with the given attributes and CV text."""
    cv_embedding = get_cv_embedding(cv_text)
    return {
        "name": name,
        "experience": experience,
        "skills": skills,
        "cv_embedding": cv_embedding.tolist() if isinstance(cv_embedding, np.ndarray) else cv_embedding,
        "email": f"{name.lower().replace(' ', '.')}@example.com"
    }

def get_predefined_mock_applicants(job_skills):
    """Create a list of predefined mock applicants with various skill levels and experiences."""
    applicants = []
    
    # Mock applicant 1: Senior with most job skills
    skills1 = job_skills[:int(len(job_skills) * 0.8)]  # 80% of required skills
    cv_text1 = f"Senior professional with 8 years of experience in {', '.join(skills1)}. Led multiple projects and teams."
    applicants.append(create_mock_applicant("Sarah Johnson", "senior", skills1, cv_text1))
    
    # Mock applicant 2: Mid-level with some job skills
    skills2 = job_skills[:int(len(job_skills) * 0.6)]  # 60% of required skills
    cv_text2 = f"Mid-level professional with 4 years of experience in {', '.join(skills2)}. Contributed to various projects."
    applicants.append(create_mock_applicant("Michael Chen", "mid level", skills2, cv_text2))
    
    # Mock applicant 3: Entry level with fewer job skills
    skills3 = job_skills[:int(len(job_skills) * 0.4)]  # 40% of required skills
    cv_text3 = f"Recent graduate with internship experience in {', '.join(skills3)}. Eager to learn and grow."
    applicants.append(create_mock_applicant("Alex Rodriguez", "entry level", skills3, cv_text3))
    
    # Mock applicant 4: Senior but with fewer matching skills
    custom_skills = job_skills[:2] + ["Leadership", "Team Management", "Strategic Planning"]
    cv_text4 = f"Senior manager with 10 years of experience. Expert in {', '.join(custom_skills)}."
    applicants.append(create_mock_applicant("Taylor Williams", "senior", custom_skills, cv_text4))
    
    # Mock applicant 5: Perfect match for job
    cv_text5 = f"Ideal candidate with experience in all required skills: {', '.join(job_skills)}."
    applicants.append(create_mock_applicant("Jamie Perfect", "mid level", job_skills, cv_text5))
    
    return applicants

def main():
    """
    Test the candidate recommendation system.
    This script:
    1. Asks the user for a job_id to recommend candidates for
    2. Optionally asks for a specific candidate_id to compare with the job
    3. Or allows adding mock applicants and comparing them to the job
    4. Displays the top candidates or specific candidate match details
    """
    print("\n===== Candidate Recommendation System Tester =====\n")
    
    # Connect to MongoDB
    try:
        mongo_uri = MONGODB_URI
        db_name = MONGODB_DB_NAME
        db = connect_to_mongo(mongo_uri, db_name)
        print(f"Connected to database: {db_name}")
    except Exception as e:
        print(f"Error connecting to database: {e}")
        return
    
    # Initialize the recommender system
    recommender = CandidateRecommender()
    recommender.initialize(db["users"], db["job"])
    
    # Check if job ID was passed as a command line argument
    if len(sys.argv) > 1:
        job_id = sys.argv[1]
        auto_mode = True
        print(f"Auto mode enabled with job ID: {job_id}")
    else:
        # Get job ID from user
        job_id = input("\nEnter job ID to find top candidates: ").strip()
        auto_mode = False
    
    if not job_id:
        print("Job ID cannot be empty.")
        return
    
    # Validate job ID
    try:
        job = db["job"].find_one({"_id": ObjectId(job_id)})
        if not job:
            print(f"Job with ID {job_id} not found.")
            return
        print(f"Job found: {job.get('title', 'No title')}")
        
        # Show job details
        print(f"Experience required: {job.get('experience', 'Not specified')}")
        
        job_skills = job.get('skills', [])
        if job_skills:
            print("Required skills:")
            for skill in job_skills:
                print(f"  - {skill}")
    except Exception as e:
        print(f"Invalid job ID: {e}")
        return
    
    # Check if job has applicants
    job_with_applicants = db["job"].find_one(
        {"_id": ObjectId(job_id)},
        {"applicants": 1}
    )
    applicants = job_with_applicants.get("applicants", [])
    if not applicants:
        print("This job has no existing applicants.")
    else:
        print(f"This job has {len(applicants)} existing applicants.")
    
    # For auto mode, automatically use predefined mock applicants
    if auto_mode:
        option = "4"  # Auto mode with predefined applicants
        print("\nRunning in auto mode with predefined mock applicants...")
    else:
        # Ask user what they want to do
        print("\nSelect an option:")
        print("1. Test with existing applicants")
        print("2. Add mock applicants for testing")
        print("3. Test a specific existing candidate")
        print("4. Use predefined mock applicants (non-interactive)")
        
        option = input("\nEnter option (1-4): ").strip()
    
    if option == "1":
        # Test with existing applicants
        if not applicants:
            print("This job has no existing applicants. Try option 2 or 4 instead.")
            return
            
        # Get top recommendations from existing applicants
        try:
            if auto_mode:
                top_k = 5
                min_similarity = 0.5
            else:
                top_k = int(input("Number of top candidates to show (default 5): ") or "5")
                min_similarity = float(input("Minimum similarity threshold (0.0-1.0, default 0.5): ") or "0.5")
            
            print("\nFinding top candidates from existing applicants...")
            recommendations = recommender.recommend_candidates(
                job_id=job_id,
                top_k=top_k,
                min_similarity=min_similarity
            )
            
            if not recommendations:
                print("No suitable candidates found.")
                return
                
            # Display results
            print(f"\n----- Top {len(recommendations)} Candidates -----")
            for i, rec in enumerate(recommendations, 1):
                print(f"\n{i}. {rec['name']} ({rec['email']})")
                print(f"   ID: {rec['candidate_id']}")
                print(f"   Content similarity: {rec['content_similarity']:.4f}")
                print(f"   Experience match: {rec['experience_match']:.4f} (Candidate: {rec['experience']})")
                print(f"   Skills match: {rec['skills_match']:.4f}")
                print(f"   Overall score: {rec['final_score']:.4f}")
                print(f"   Matching skills ({len(rec['matching_skills'])}):")
                for skill in rec['matching_skills']:
                    print(f"    - {skill}")
                
        except Exception as e:
            print(f"Error getting recommendations: {e}")
            return
            
    elif option == "2":
        # Add and test mock applicants
        print("\n----- Add Mock Applicants for Testing -----")
        
        # Get job embedding and details for testing
        job_embedding = recommender.get_job_embedding(job_id)
        job_skills = recommender.get_job_required_skills(job_id)
        job_experience = recommender.get_job_experience_level(job_id)
        
        mock_applicants = []
        
        num_applicants = int(input("\nHow many mock applicants do you want to add? ").strip() or "3")
        
        for i in range(num_applicants):
            print(f"\n--- Mock Applicant #{i+1} ---")
            name = input("Name: ").strip() or f"Test Applicant {i+1}"
            
            print("\nSelect experience level:")
            print("1. Entry Level")
            print("2. Associate")
            print("3. Mid Level")
            print("4. Senior")
            print("5. Executive")
            exp_choice = input("Choose experience (1-5): ").strip() or "1"
            
            experience_map = {
                "1": "entry level",
                "2": "associate",
                "3": "mid level",
                "4": "senior",
                "5": "executive"
            }
            experience = experience_map.get(exp_choice, "entry level")
            
            print("\nEnter skills (comma-separated):")
            if job_skills:
                print("Job requires these skills:", ", ".join(job_skills))
            skills_input = input("Skills: ").strip()
            skills = [s.strip() for s in skills_input.split(",")] if skills_input else []
            
            print("\nEnter a brief CV text or description (used for embedding):")
            cv_text = input("CV text: ").strip() or f"Candidate with {experience} experience in {', '.join(skills)}"
            
            # Create the mock applicant
            mock_applicant = create_mock_applicant(name, experience, skills, cv_text)
            mock_applicants.append(mock_applicant)
            print(f"Added mock applicant: {name}")
        
        if not mock_applicants:
            print("No mock applicants were added.")
            return
            
        print(f"\nAdded {len(mock_applicants)} mock applicants for testing.")
        
        # Calculate scores and rank mock applicants
        final_scores = []
        for applicant in mock_applicants:
            # Calculate content similarity
            applicant_embedding = np.array(applicant['cv_embedding'])
            content_similarity = float(np.dot(job_embedding, applicant_embedding) / 
                                    (np.linalg.norm(job_embedding) * np.linalg.norm(applicant_embedding)))
            
            # Calculate other scores
            experience_match = recommender.calculate_experience_match_score(
                applicant['experience'], 
                job_experience
            )
            skills_match = recommender.calculate_skills_match_score(
                applicant['skills'],
                job_skills
            )
            
            # Calculate final score with default weights
            final_score = (content_similarity * 0.6) + (experience_match * 0.2) + (skills_match * 0.2)
            
            # Store all scores
            applicant['content_similarity'] = content_similarity
            applicant['experience_match'] = experience_match
            applicant['skills_match'] = skills_match
            applicant['final_score'] = final_score
            applicant['matching_skills'] = list(set([s.lower().strip() for s in applicant['skills']]) & 
                                              set([s.lower().strip() for s in job_skills]))
            
            final_scores.append(final_score)
        
        # Rank and display results
        ranked_indices = np.argsort(final_scores)[::-1]
        
        print("\n----- Ranked Mock Applicants -----")
        
        for rank, idx in enumerate(ranked_indices, 1):
            applicant = mock_applicants[idx]
            print(f"\n{rank}. {applicant['name']} ({applicant['email']})")
            print(f"   Content similarity: {applicant['content_similarity']:.4f}")
            print(f"   Experience match: {applicant['experience_match']:.4f} (Candidate: {applicant['experience']})")
            print(f"   Skills match: {applicant['skills_match']:.4f}")
            print(f"   Overall score: {applicant['final_score']:.4f}")
            print(f"   Matching skills ({len(applicant['matching_skills'])}/{len(job_skills)}):")
            for skill in applicant['matching_skills']:
                print(f"    - {skill}")
            
        # Announce top candidate
        if ranked_indices.size > 0:
            top_applicant = mock_applicants[ranked_indices[0]]
            print(f"\n===== Top Candidate: {top_applicant['name']} with score {top_applicant['final_score']:.4f} =====")
            
    elif option == "3":
        # Test specific candidate
        candidate_id = input("Enter candidate ID to test: ").strip()
        if not candidate_id:
            print("Candidate ID cannot be empty.")
            return
        
        # Validate candidate ID
        try:
            user = db["users"].find_one({"_id": ObjectId(candidate_id)})
            if not user:
                print(f"User with ID {candidate_id} not found.")
                return
            
            if "cv_embedding" not in user:
                print("This user does not have a CV embedding.")
                return
                
            print(f"Found candidate: {user.get('name', 'Unknown')}")
            
            # Check if candidate has applied for the job
            if ObjectId(candidate_id) not in applicants:
                print("Note: This candidate has not applied for this job.")
            
            # Get job embedding and details
            job_embedding = recommender.get_job_embedding(job_id)
            job_skills = recommender.get_job_required_skills(job_id)
            job_experience = recommender.get_job_experience_level(job_id)
            
            # Get user embedding and details
            user_embedding = np.array(user.get("cv_embedding", []))
            user_skills = user.get("skills", [])
            user_experience = user.get("experience", "entry level")
            
            # Calculate similarity scores
            content_similarity = float(np.dot(job_embedding, user_embedding) / 
                                      (np.linalg.norm(job_embedding) * np.linalg.norm(user_embedding)))
            experience_match = recommender.calculate_experience_match_score(user_experience, job_experience)
            skills_match = recommender.calculate_skills_match_score(user_skills, job_skills)
            
            # Calculate final score with default weights
            final_score = (content_similarity * 0.6) + (experience_match * 0.2) + (skills_match * 0.2)
            
            # Display results
            print("\n----- Candidate Match Results -----")
            print(f"Candidate: {user.get('name', 'Unknown')}")
            print(f"Content similarity: {content_similarity:.4f}")
            print(f"Experience match: {experience_match:.4f} (Candidate: {user_experience}, Job: {job_experience})")
            print(f"Skills match: {skills_match:.4f}")
            print(f"Overall match score: {final_score:.4f}")
            
            # Show matching skills
            matching_skills = set([s.lower().strip() for s in user_skills]) & set([s.lower().strip() for s in job_skills])
            print(f"\nMatching skills ({len(matching_skills)}/{len(job_skills)}):")
            for skill in matching_skills:
                print(f"  - {skill}")
            
            # Show missing skills
            missing_skills = set([s.lower().strip() for s in job_skills]) - set([s.lower().strip() for s in user_skills])
            if missing_skills:
                print(f"\nMissing skills ({len(missing_skills)}/{len(job_skills)}):")
                for skill in missing_skills:
                    print(f"  - {skill}")
                    
        except Exception as e:
            print(f"Error testing candidate: {e}")
            return
            
    elif option == "4":
        # Use predefined mock applicants (non-interactive)
        print("\n----- Using Predefined Mock Applicants -----")
        
        # Get job embedding and details for testing
        job_embedding = recommender.get_job_embedding(job_id)
        job_skills = recommender.get_job_required_skills(job_id)
        job_experience = recommender.get_job_experience_level(job_id)
        
        # Create predefined mock applicants
        mock_applicants = get_predefined_mock_applicants(job_skills)
        print(f"Created {len(mock_applicants)} predefined mock applicants.")
        
        # Calculate scores and rank mock applicants
        final_scores = []
        for applicant in mock_applicants:
            # Calculate content similarity
            applicant_embedding = np.array(applicant['cv_embedding'])
            content_similarity = float(np.dot(job_embedding, applicant_embedding) / 
                                    (np.linalg.norm(job_embedding) * np.linalg.norm(applicant_embedding)))
            
            # Calculate other scores
            experience_match = recommender.calculate_experience_match_score(
                applicant['experience'], 
                job_experience
            )
            skills_match = recommender.calculate_skills_match_score(
                applicant['skills'],
                job_skills
            )
            
            # Calculate final score with default weights
            final_score = (content_similarity * 0.6) + (experience_match * 0.2) + (skills_match * 0.2)
            
            # Store all scores
            applicant['content_similarity'] = content_similarity
            applicant['experience_match'] = experience_match
            applicant['skills_match'] = skills_match
            applicant['final_score'] = final_score
            applicant['matching_skills'] = list(set([s.lower().strip() for s in applicant['skills']]) & 
                                              set([s.lower().strip() for s in job_skills]))
            
            final_scores.append(final_score)
        
        # Rank and display results
        ranked_indices = np.argsort(final_scores)[::-1]
        
        print("\n----- Ranked Mock Applicants -----")
        
        for rank, idx in enumerate(ranked_indices, 1):
            applicant = mock_applicants[idx]
            print(f"\n{rank}. {applicant['name']} ({applicant['email']})")
            print(f"   Content similarity: {applicant['content_similarity']:.4f}")
            print(f"   Experience match: {applicant['experience_match']:.4f} (Candidate: {applicant['experience']})")
            print(f"   Skills match: {applicant['skills_match']:.4f}")
            print(f"   Overall score: {applicant['final_score']:.4f}")
            print(f"   Matching skills ({len(applicant['matching_skills'])}/{len(job_skills)}):")
            for skill in applicant['matching_skills']:
                print(f"    - {skill}")
            
        # Announce top candidate
        if ranked_indices.size > 0:
            top_applicant = mock_applicants[ranked_indices[0]]
            print(f"\n===== Top Candidate: {top_applicant['name']} with score {top_applicant['final_score']:.4f} =====")
            
    else:
        print("Invalid option selected.")

if __name__ == "__main__":
    main()
