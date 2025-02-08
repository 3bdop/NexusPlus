# job_recommender/text_preprocessing.py

import re
import spacy
from .advanced_ner import extract_entities  # Import the advanced NER module

# Load a lightweight spaCy model for cleaning and lemmatization.
nlp = spacy.load("en_core_web_sm")

def clean_text(text: str) -> str:
    """
    Clean extracted text by removing noise (headers, footers, extra formatting).
    """
    lines = text.splitlines()
    cleaned_lines = []
    for line in lines:
        # Remove lines that look like page numbers or headers.
        if re.match(r'^\s*(page\s*\d+|\d+)\s*$', line.lower()):
            continue
        line = re.sub(r'[-_]{2,}', '', line)
        cleaned_lines.append(line.strip())
    cleaned_text = "\n".join(cleaned_lines)
    cleaned_text = re.sub(r'\s+', ' ', cleaned_text)
    return cleaned_text

def preprocess_text(text: str) -> (str, list):
    """
    Preprocess text: cleaning, lemmatization, and advanced named entity recognition (NER).
    
    Returns:
      - normalized (lemmatized) text
      - list of extracted entities (as tuples of (text, label))
    """
    cleaned = clean_text(text)
    doc = nlp(cleaned)
    tokens = [token.lemma_ for token in doc if not token.is_stop and not token.is_punct]
    normalized_text = " ".join(tokens)
    
    # Extract entities using the advanced NER module.
    entities = extract_entities(cleaned)
    
    return normalized_text, entities
