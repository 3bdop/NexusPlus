# job_recommender/text_preprocessing.py

import re
import spacy
import requests
import json

# Load spaCy model for lemmatization only
nlp = spacy.load("en_core_web_sm")

# Replace with your actual Gemini API key
GEMINI_API_KEY = "AIzaSyAg0Wafq9D-wAR50S9by6ffSgmVUZEG8vs"
GEMINI_ENDPOINT = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"

def gemini_ner(text: str) -> list:
    """
    Uses the Gemini API to extract named entities via a prompt.
    Returns a JSON array with each element as an object containing 'entity' and 'type'.
    """
    headers = {"Content-Type": "application/json"}
    prompt_text = (
        "Extract named entities from the following text. Return the result as a JSON array where each element is an object with keys 'entity' and 'type'. "
        "Only return the JSON array without any commentary.\n\nText:\n" + text
    )
    payload = {"contents": [{"parts": [{"text": prompt_text}]}]}
    
    try:
        response = requests.post(GEMINI_ENDPOINT, json=payload, headers=headers)
        response.raise_for_status()
        result = response.json()
        candidate_parts = result.get("candidates", [{}]).pop().get("content", {}).get("parts", [])
        candidate_text = " ".join(part.get("text", "") for part in candidate_parts).strip()
        # Remove markdown code block markers if present
        if candidate_text.startswith("```"):
            candidate_text = candidate_text.split("\n", 1)[-1]
            if candidate_text.endswith("```"):
                candidate_text = candidate_text.rsplit("```", 1)[0].strip()
        entities = json.loads(candidate_text)
        return entities if isinstance(entities, list) else []
    except Exception as e:
        print(f"Gemini API error: {e}")
        return []

def clean_text(text: str) -> str:
    """
    Removes headers, footers, and extra formatting from the text.
    """
    lines = text.splitlines()
    cleaned_lines = [re.sub(r'[-_]{2,}', '', line).strip() for line in lines if not re.match(r'^\s*(page\s*\d+|\d+)\s*$', line.lower())]
    return re.sub(r'\s+', ' ', "\n".join(cleaned_lines)).strip()

def preprocess_text(text: str) -> (str, list):
    """
    Cleans, lemmatizes the text, and extracts named entities using the Gemini API.
    Returns normalized text and a list of extracted entities.
    """
    cleaned = clean_text(text)
    doc = nlp(cleaned)
    normalized_text = " ".join(token.lemma_ for token in doc if not token.is_stop and not token.is_punct)
    entities = gemini_ner(cleaned)
    return normalized_text, entities
