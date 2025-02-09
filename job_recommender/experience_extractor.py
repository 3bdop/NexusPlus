# job_recommender/experience_extractor.py

import re

def extract_experience(text: str) -> int:
    """
    Extracts the highest number of years of experience mentioned in the text.
    Looks for patterns such as "3 years", "5+ yrs", etc.
    
    Returns:
      The maximum number of years found, or 0 if none is found.
    """
    # This regex looks for a number optionally followed by a plus sign and then the words "years" or "yrs"
    pattern = r'(\d+)\s*\+?\s*(?:years|yrs)'
    matches = re.findall(pattern, text, flags=re.IGNORECASE)
    if matches:
        experiences = [int(num) for num in matches]
        return max(experiences)
    return 0
