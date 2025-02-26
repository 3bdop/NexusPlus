# job_recommender/experience_extractor.py

import re

def extract_experience(text: str) -> int:
    """
    Extracts the highest number of years of experience from the text.
    Looks for patterns like "3 years" or "5+ yrs".
    """
    pattern = r'(\d+)\s*\+?\s*(?:years|yrs)'
    matches = re.findall(pattern, text, flags=re.IGNORECASE)
    return max([int(num) for num in matches], default=0)
