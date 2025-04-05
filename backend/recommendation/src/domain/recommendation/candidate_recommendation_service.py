# src/domain/recommendation/candidate_recommendation_service.py

import numpy as np
from typing import List, Dict
from bson import ObjectId
from sklearn.metrics.pairwise import cosine_similarity

from src.utils.db_service import get_job_skills_by_ids


class CandidateRecommender:
    def __init__(self):
        self.users_collection = None
        self.jobs_collection = None

    def initialize(self, users_collection, jobs_collection) -> None:
        """Initialize with MongoDB collections."""
        self.users_collection = users_collection
        self.jobs_collection = jobs_collection
        print("Candidate recommender initialized with database collections")

    def get_job_embedding(self, job_id: str) -> np.ndarray:
        """Retrieve embedding for a specific job from the database."""
        job = self.jobs_collection.find_one(
            {"_id": ObjectId(job_id)},
            {"embedding": 1, "title": 1, "description": 1, "skills": 1}
        )

        if not job:
            print(f"Job with ID {job_id} not found")
            raise ValueError(f"Job with ID {job_id} not found")

        if "embedding" not in job or not job["embedding"]:
            print(f"Job with ID {job_id} has no embedding. Title: {job.get('title', 'Unknown')}")
            raise ValueError(f"Job with ID {job_id} has no embedding. Please ensure the job has an embedding before using the recommendation system.")

        return np.array(job["embedding"])

    def get_job_required_skills(self, job_id: str) -> list:
        """Get skills required for a specific job."""
        # First try to get skills from the skills_dict function
        skills_dict = get_job_skills_by_ids(self.jobs_collection, [job_id])
        skills = skills_dict.get(job_id, [])

        # If no skills found, try to get them directly from the job document
        if not skills:
            print(f"No skills found for job {job_id} in skills_dict, trying direct lookup")
            job = self.jobs_collection.find_one(
                {"_id": ObjectId(job_id)},
                {"skills": 1, "title": 1, "description": 1}
            )

            if job and "skills" in job and job["skills"]:
                skills = job["skills"]
                print(f"Found {len(skills)} skills directly in job document")
            else:
                print(f"No skills found in job document, extracting from title/description")
                # Try to extract skills from job title or description
                common_skills = [
                    "python", "javascript", "java", "c++", "c#", "ruby", "php", "swift",
                    "react", "angular", "vue", "node", "express", "django", "flask",
                    "sql", "nosql", "mongodb", "mysql", "postgresql", "oracle",
                    "aws", "azure", "gcp", "cloud", "devops", "ci/cd", "docker", "kubernetes",
                    "machine learning", "ai", "data science", "big data", "analytics",
                    "frontend", "backend", "fullstack", "web", "mobile", "android", "ios",
                    "ui", "ux", "design", "product", "project management", "agile", "scrum"
                ]

                extracted_skills = []
                job_text = f"{job.get('title', '')} {job.get('description', '')}".lower()

                for skill in common_skills:
                    if skill.lower() in job_text:
                        extracted_skills.append(skill)

                if extracted_skills:
                    print(f"Extracted {len(extracted_skills)} skills from job title/description: {extracted_skills}")
                    skills = extracted_skills
                else:
                    print("Could not extract any skills, using empty list")

        return skills

    def get_job_experience_level(self, job_id: str) -> str:
        """Get experience level required for a specific job."""
        job = self.jobs_collection.find_one(
            {"_id": ObjectId(job_id)},
            {"experience": 1, "title": 1, "description": 1}
        )

        if not job:
            print(f"Job with ID {job_id} not found, using default experience level")
            return "entry level"

        # If experience is explicitly set, use it
        if "experience" in job and job["experience"]:
            experience = job["experience"]
            print(f"Found experience level in job document: {experience}")
            return experience

        # Try to extract experience level from job title or description
        print(f"No experience level found in job document, extracting from title/description")
        job_text = f"{job.get('title', '')} {job.get('description', '')}".lower()

        # Check for experience level keywords in the job text
        if "senior" in job_text or "lead" in job_text or "principal" in job_text or "staff" in job_text:
            print("Extracted experience level: senior")
            return "senior"
        elif "mid" in job_text or "intermediate" in job_text or "experienced" in job_text:
            print("Extracted experience level: mid level")
            return "mid level"
        elif "junior" in job_text or "entry" in job_text or "graduate" in job_text or "trainee" in job_text:
            print("Extracted experience level: entry level")
            return "entry level"
        else:
            print("Could not extract experience level, using default: entry level")
            return "entry level"

    def get_applicants_for_job(self, job_id: str) -> List[Dict]:
        """Get all users who applied for a specific job."""
        job = self.jobs_collection.find_one(
            {"_id": ObjectId(job_id)},
            {"applicants": 1, "title": 1}
        )

        if not job or "applicants" not in job or not job["applicants"]:
            print(f"Job {job_id} has no applicants")
            return []

        applicant_ids = job["applicants"]
        print(f"Job '{job.get('title', 'Unknown')}' has {len(applicant_ids)} applicants: {applicant_ids}")

        # Convert string IDs to ObjectId if needed
        object_ids = []
        for app_id in applicant_ids:
            if isinstance(app_id, str):
                try:
                    object_ids.append(ObjectId(app_id))
                except Exception as e:
                    print(f"Error converting applicant ID {app_id} to ObjectId: {e}")
            else:
                object_ids.append(app_id)

        if not object_ids:
            print("No valid applicant IDs found")
            return []

        applicants = []
        all_applicants = []

        # Get all fields that might contain CV embeddings
        cursor = self.users_collection.find(
            {"_id": {"$in": object_ids}}
        )

        # Print all users found
        user_count = 0
        for user in cursor:
            user_count += 1
            print(f"Found applicant: {user.get('username', 'Unknown')} (ID: {user['_id']})")

            # Check what fields the user has
            user_fields = list(user.keys())
            print(f"User fields: {user_fields}")

            # Store all applicants for potential fallback
            all_applicants.append({
                "id": str(user["_id"]),
                "skills": user.get("skills", []),
                "experience": user.get("experience", "entry level"),
                "name": user.get("username", "Unknown"),
                "email": user.get("email", "No email")
            })

            # Check for CV embedding - we know it's stored in the 'cv_embedding' field
            if "cv_embedding" in user and user["cv_embedding"]:
                print(f"Found cv_embedding for user {user.get('username', 'Unknown')}")
                applicants.append({
                    "id": str(user["_id"]),
                    "embedding": user["cv_embedding"],
                    "skills": user.get("skills", []),
                    "experience": user.get("experience", "entry level"),
                    "name": user.get("username", "Unknown"),
                    "email": user.get("email", "No email")
                })
            else:
                print(f"No cv_embedding found for user {user.get('username', 'Unknown')}")
                print(f"Skipping user {user.get('username', 'Unknown')} for recommendation")

        print(f"Found {user_count} users, {len(applicants)} with embeddings")

        # If no applicants have CV embeddings, use a fallback approach
        if not applicants and all_applicants:
            print(f"No applicants with CV embeddings found for job {job_id}. Using fallback approach.")
            # Sort by experience level as a simple fallback
            experience_levels = {
                "entry level": 1,
                "associate": 2,
                "mid level": 3,
                "senior": 4,
                "executive": 5
            }

            # Sort applicants by experience level (higher is better)
            all_applicants.sort(
                key=lambda x: experience_levels.get(x.get("experience", "").lower(), 0),
                reverse=True
            )

            # Return the top applicants
            return all_applicants

        return applicants

    def calculate_experience_match_score(self, user_experience: str, job_experience: str) -> float:
        """
        Calculate a match score between user experience level and job required experience.
        """
        # Print the input values for debugging
        print(f"Calculating experience match: user='{user_experience}', job='{job_experience}'")

        # Handle None or empty values
        if not user_experience or not job_experience:
            print("  Missing experience data, using default mapping")
            # Map common job titles to experience levels as a fallback
            if user_experience and "senior" in user_experience.lower():
                user_experience = "senior"
            elif user_experience and ("mid" in user_experience.lower() or "intermediate" in user_experience.lower()):
                user_experience = "mid level"
            elif user_experience and ("junior" in user_experience.lower() or "entry" in user_experience.lower()):
                user_experience = "entry level"
            else:
                user_experience = "entry level"

            if job_experience and "senior" in job_experience.lower():
                job_experience = "senior"
            elif job_experience and ("mid" in job_experience.lower() or "intermediate" in job_experience.lower()):
                job_experience = "mid level"
            elif job_experience and ("junior" in job_experience.lower() or "entry" in job_experience.lower()):
                job_experience = "entry level"
            else:
                job_experience = "entry level"

            print(f"  Mapped to: user='{user_experience}', job='{job_experience}'")

        user_exp = user_experience.lower().strip()
        job_exp = job_experience.lower().strip()

        # Levels for consistent comparisons
        experience_levels = {
            "entry level": 1,
            "junior": 1,
            "associate": 2,
            "mid level": 3,
            "intermediate": 3,
            "senior": 4,
            "executive": 5,
            "lead": 4,
            "manager": 4,
            "director": 5
        }

        # Try to match partial experience levels
        user_level = 0
        for exp_key, exp_level in experience_levels.items():
            if exp_key in user_exp:
                user_level = exp_level
                break

        job_level = 0
        for exp_key, exp_level in experience_levels.items():
            if exp_key in job_exp:
                job_level = exp_level
                break

        # If still not found, use default values
        if user_level == 0:
            user_level = experience_levels.get(user_exp, 2)  # Default to associate level

        if job_level == 0:
            job_level = experience_levels.get(job_exp, 2)  # Default to associate level

        print(f"  Experience levels: user={user_level}, job={job_level}")

        # For candidates, slightly favor more experienced candidates
        if user_level >= job_level:
            if user_level - job_level <= 1:
                score = 1.0  # Perfect match or slightly more experienced
            elif user_level - job_level == 2:
                score = 0.8  # More experienced than required
            else:
                score = 0.6  # Much more experienced
        else:
            diff = job_level - user_level
            if diff == 1:
                score = 0.7  # Slightly less experience
            elif diff == 2:
                score = 0.4  # Significantly less experience
            else:
                score = 0.2  # Far less experience

        print(f"  Experience match score: {score}")
        return score

    def calculate_skills_match_score(self, user_skills: list, job_skills: list) -> float:
        """
        Calculate similarity score between user skills and job required skills.
        """
        # Print the input values for debugging
        print(f"Calculating skills match: user_skills={user_skills}, job_skills={job_skills}")

        # Handle empty skills lists
        if not user_skills and not job_skills:
            print("  Both user and job skills are empty, using default score of 0.5")
            return 0.5

        if not user_skills:
            print("  User has no skills, using low score of 0.2")
            return 0.2

        if not job_skills:
            print("  Job has no required skills, using neutral score of 0.6")
            return 0.6

        # Normalize skills for comparison
        user_skills_norm = [s.lower().strip() for s in user_skills]
        job_skills_norm = [s.lower().strip() for s in job_skills]

        # Find exact matching skills
        exact_matching_skills = set(user_skills_norm) & set(job_skills_norm)

        # Find partial matching skills (e.g., "python" matches "python programming")
        partial_matching_skills = set()
        for user_skill in user_skills_norm:
            for job_skill in job_skills_norm:
                if user_skill in job_skill or job_skill in user_skill:
                    if user_skill not in exact_matching_skills and job_skill not in exact_matching_skills:
                        partial_matching_skills.add((user_skill, job_skill))

        # Calculate match percentages
        exact_match_count = len(exact_matching_skills)
        partial_match_count = len(partial_matching_skills)
        total_match_count = exact_match_count + (partial_match_count * 0.5)  # Partial matches count as half

        # For candidates, job coverage is more important than diversity of skills
        job_coverage = total_match_count / len(job_skills_norm) if job_skills_norm else 0
        user_coverage = total_match_count / len(user_skills_norm) if user_skills_norm else 0

        # Print detailed matching information
        print(f"  Exact matching skills ({exact_match_count}): {exact_matching_skills}")
        print(f"  Partial matching skills ({partial_match_count}): {partial_matching_skills}")
        print(f"  Job coverage: {job_coverage:.2f}, User coverage: {user_coverage:.2f}")

        # Weighing job coverage higher for candidate recommendation
        score = (0.8 * job_coverage) + (0.2 * user_coverage)

        # Ensure the score is between 0 and 1
        score = max(0.0, min(1.0, score))

        print(f"  Skills match score: {score}")
        return score

    def recommend_candidates(
        self,
        job_id: str,
        top_k: int = 5,
        min_similarity: float = 0.5,
        content_weight: float = 0.6,
        experience_weight: float = 0.2,
        skills_weight: float = 0.2
    ) -> List[Dict]:
        """
        Get candidate recommendations for a specific job.
        """
        print(f"\n\n==== Starting recommendation process for job {job_id} ====\n")

        if self.users_collection is None or self.jobs_collection is None:
            print("Error: Recommender not initialized with collections")
            raise ValueError("Recommender has not been initialized with collections")

        # Check if job exists
        job = self.jobs_collection.find_one({"_id": ObjectId(job_id)})
        if not job:
            print(f"Error: Job with ID {job_id} not found")
            return []

        print(f"Found job: {job.get('title', 'Unknown')}")

        # Check if job has applicants
        if not job.get('applicants') or len(job.get('applicants', [])) == 0:
            print(f"Job has no applicants. Returning empty recommendations.")
            return []

        print(f"Job has {len(job.get('applicants', []))} applicants")

        # Get job embedding and required skills
        job_embedding = None
        try:
            job_embedding = self.get_job_embedding(job_id)
            print(f"Successfully retrieved job embedding")
        except Exception as e:
            print(f"Error retrieving job embedding: {e}")
            # If we can't get the job embedding, we'll use the fallback approach

        try:
            job_skills = self.get_job_required_skills(job_id)
            print(f"Job skills: {job_skills}")
        except Exception as e:
            print(f"Error retrieving job skills: {e}")
            job_skills = []

        try:
            job_experience = self.get_job_experience_level(job_id)
            print(f"Job experience level: {job_experience}")
        except Exception as e:
            print(f"Error retrieving job experience: {e}")
            job_experience = "entry level"

        # Get applicants for the job
        applicants = self.get_applicants_for_job(job_id)
        print(f"Retrieved {len(applicants)} applicants from database")

        if not applicants:
            print("No valid applicants found. Returning empty recommendations.")
            return []

        # Check if we have applicants with embeddings
        applicants_with_embeddings = [a for a in applicants if 'embedding' in a]
        print(f"Found {len(applicants_with_embeddings)} applicants with CV embeddings")

        # If we have applicants with embeddings and a job embedding, use the standard recommendation approach
        if applicants_with_embeddings and job_embedding is not None:
            # Prepare applicant embeddings for similarity calculation
            applicant_vectors = np.array([applicant['embedding'] for applicant in applicants_with_embeddings])
            content_similarities = cosine_similarity([job_embedding], applicant_vectors)[0]

            # Calculate final scores
            final_scores = []
            for idx, content_score in enumerate(content_similarities):
                applicant = applicants_with_embeddings[idx]

                # Calculate experience match
                experience_score = self.calculate_experience_match_score(
                    applicant.get('experience', 'entry level'),
                    job_experience
                )

                # Calculate skills match
                skills_score = self.calculate_skills_match_score(
                    applicant.get('skills', []),
                    job_skills
                )

                # Calculate final weighted score
                final_score = (
                    (content_score * content_weight) +
                    (experience_score * experience_weight) +
                    (skills_score * skills_weight)
                )

                final_scores.append(final_score)

            # Get top candidates
            final_scores = np.array(final_scores)
            top_indices = np.argsort(final_scores)[-top_k:][::-1]

            # Prepare and return recommendations
            recommendations = []
            for idx in top_indices:
                if final_scores[idx] < min_similarity:
                    continue

                applicant = applicants_with_embeddings[idx]

                recommendations.append({
                    'candidate_id': applicant['id'],
                    'name': applicant['name'],
                    'email': applicant['email'],
                    'content_similarity': float(content_similarities[idx]),
                    'experience_match': float(self.calculate_experience_match_score(
                        applicant.get('experience', 'entry level'),
                        job_experience
                    )),
                    'skills_match': float(self.calculate_skills_match_score(
                        applicant.get('skills', []),
                        job_skills
                    )),
                    'final_score': float(final_scores[idx]),
                    'experience': applicant.get('experience', 'Not specified'),
                    'matching_skills': list(set(applicant.get('skills', [])) & set(job_skills)),
                    'all_skills': applicant.get('skills', [])
                })

            return recommendations
        else:
            # Fallback: Use a simpler approach based on experience and skills match
            print(f"Using fallback recommendation approach for job {job_id}")
            print(f"Reason: {'No job embedding' if job_embedding is None else 'No applicants with embeddings'}")

            recommendations = []

            # Lower the minimum similarity threshold for the fallback approach
            adjusted_min_similarity = min(min_similarity, 0.3)  # Lower threshold for fallback
            print(f"Using adjusted minimum similarity threshold: {adjusted_min_similarity}")

            # Calculate scores for all applicants
            applicant_scores = []
            for applicant in applicants:
                # Calculate experience match
                experience_score = self.calculate_experience_match_score(
                    applicant.get('experience', 'entry level'),
                    job_experience
                )

                # Calculate skills match
                skills_score = self.calculate_skills_match_score(
                    applicant.get('skills', []),
                    job_skills
                )

                # Use a simplified scoring without content similarity
                final_score = (experience_score * 0.6) + (skills_score * 0.4)

                applicant_scores.append((applicant, final_score))

            # Sort by score (highest first)
            applicant_scores.sort(key=lambda x: x[1], reverse=True)

            # Take top_k applicants
            for applicant, final_score in applicant_scores[:top_k]:
                # Only include if above adjusted minimum similarity threshold
                if final_score >= adjusted_min_similarity:
                    print(f"Adding applicant {applicant['name']} with score {final_score}")
                    # Calculate a pseudo-content similarity based on skills and experience
                    # This gives a more varied score than just using 0.5
                    experience_score = self.calculate_experience_match_score(
                        applicant.get('experience', 'entry level'),
                        job_experience
                    )

                    skills_score = self.calculate_skills_match_score(
                        applicant.get('skills', []),
                        job_skills
                    )

                    pseudo_content_similarity = (experience_score * 0.7) + (skills_score * 0.3)

                    recommendations.append({
                        'candidate_id': applicant['id'],
                        'name': applicant['name'],
                        'email': applicant['email'],
                        'content_similarity': float(pseudo_content_similarity),  # Use calculated value instead of default
                        'experience_match': float(experience_score),
                        'skills_match': float(skills_score),
                        'final_score': float(final_score),
                        'experience': applicant.get('experience', 'Not specified'),
                        'matching_skills': list(set(applicant.get('skills', [])) & set(job_skills)),
                        'all_skills': applicant.get('skills', [])
                    })
                else:
                    print(f"Skipping applicant {applicant['name']} with score {final_score} (below threshold)")

            print(f"Returning {len(recommendations)} recommendations from fallback approach")
            return recommendations
