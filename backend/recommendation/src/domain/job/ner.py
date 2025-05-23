# src/domain/job/ner.py

import logging
import re
import json
import requests

def extract_job_skills_with_gemini(job_description: str, gemini_api_key: str) -> list:
    """
    Extract required skills from a job description using Gemini.
    Works for any professional field (healthcare, engineering, etc.).
    """
    prompt = (
        "Extract professional skills and qualifications from the job description below. "
        "Consider ALL types of skills relevant to the position, including but not limited to:\n"
        "- Technical skills and certifications\n"
        "- Professional qualifications and licenses\n"
        "- Domain-specific knowledge\n"
        "- Specialized tools or equipment proficiency\n"
        "- Required methodologies or procedures\n"
        "- Industry-specific software or systems\n"
        "- Required standards or compliance knowledge\n\n"
        "Return ONLY a JSON array of skills, each skill is a short string (max 50 chars). "
        "Limit the response to 15 most important skills. "
        "Do not include any markdown formatting or code blocks. "
        "The output should be a valid JSON array only.\n\n"
        f"Job Description:\n{job_description}"
    )
    
    endpoint_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={gemini_api_key}"
    headers = {"Content-Type": "application/json"}
    payload = {
        "contents": [
            {
                "parts": [
                    {"text": prompt}
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0,
            "maxOutputTokens": 150
        }
    }
    
    try:
        response = requests.post(endpoint_url, headers=headers, json=payload)
        response.raise_for_status()
        result = response.json()
        
        completion_text = ""
        try:
            completion_text = (
                result.get("candidates", [{}])[0]
                .get("content", {})
                .get("parts", [{}])[0]
                .get("text", "")
                .strip()
            )
            completion_text = re.sub(r'```(?:json)?\s*([\s\S]*?)```', r'\1', completion_text).strip()
            if completion_text.count('[') > completion_text.count(']'):
                completion_text = completion_text[:completion_text.rfind('\n')]
                if not completion_text.endswith(']'):
                    completion_text += ']'
            if not completion_text.startswith('['):
                completion_text = '[' + completion_text
            if not completion_text.endswith(']'):
                completion_text += ']'
            
            logging.info(f"Cleaned JSON: {completion_text}")
            
            try:
                skills = json.loads(completion_text)
                if isinstance(skills, list):
                    cleaned_skills = []
                    for skill in skills:
                        if isinstance(skill, str):
                            cleaned_skill = " ".join(skill.split())
                            if cleaned_skill:
                                cleaned_skills.append(cleaned_skill)
                    return cleaned_skills
                else:
                    logging.error("Parsed JSON is not a list")
                    return []
                    
            except json.JSONDecodeError as je:
                logging.error(f"JSON parsing error: {je}")
                pattern = r'"([^"]+)"|\'([^\']+)\''
                matches = re.findall(pattern, completion_text)
                extracted_skills = []
                for match in matches:
                    skill = match[0] or match[1]
                    if skill:
                        extracted_skills.append(skill.strip())
                return extracted_skills
                
        except (KeyError, IndexError) as e:
            logging.error(f"Failed to extract text from Gemini response: {e}")
            return []
            
    except requests.exceptions.RequestException as e:
        logging.error(f"Gemini API call failed: {e}")
        return []
