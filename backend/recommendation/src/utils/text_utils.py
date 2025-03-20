# src/utils/text_utils.py

import re
import logging
import spacy

# Optional: Load GPU if available
if spacy.prefer_gpu():
    spacy.require_gpu()
    print("GPU is available and is being used by spaCy!")
else:
    print("GPU is not available; using CPU.")

# Load spaCy model; spaCy provides its own stopword list.
nlp = spacy.load("en_core_web_sm")

def clean_text_headers(text: str) -> str:
    """
    Removes headers, footers, and extra formatting from the text.
    """
    lines = text.splitlines()
    cleaned_lines = []
    for line in lines:
        cleaned_line = re.sub(r'[-_]{2,}', '', line).strip()
        # Avoid lines that only say "page X" or just a number
        if not re.match(r'^\s*(page\s*\d+|\d+)\s*$', cleaned_line.lower()):
            cleaned_lines.append(cleaned_line)
    return "\n".join(cleaned_lines)

def clean_text(text: str) -> str:
    """
    Cleans text by:
      - Lowercasing
      - Removing URLs, email addresses, HTML tags
      - Removing headers/footers
      - Stripping special characters and extra whitespace
      - Removing stopwords using spaCy's default stopword list
    """
    text = text.lower()
    text = re.sub(r'http[s]?://\S+', '', text)
    text = re.sub(r'\S+@\S+', '', text)
    text = re.sub(r'<.*?>', '', text)
    text = clean_text_headers(text)
    text = re.sub(r'[^\w\s]', '', text)
    text = re.sub(r'\s+', ' ', text).strip()

    # Use spaCy to filter out stopwords
    doc = nlp(text)
    filtered_text = " ".join(token.text for token in doc if token.text not in nlp.Defaults.stop_words)
    
    return filtered_text

def process_text(text: str) -> str:
    """
    Processes text by first cleaning it and then lemmatizing it with spaCy.
    """
    cleaned_text = clean_text(text)
    if not cleaned_text:
        return ""
    doc = nlp(cleaned_text)
    normalized_text = " ".join(token.lemma_ for token in doc if not token.is_stop and not token.is_punct)
    return normalized_text
