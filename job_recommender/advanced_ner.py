# job_recommender/advanced_ner.py

import spacy
from transformers import pipeline

# -------------------------------
# Load spaCy transformer-based model
# -------------------------------
try:
    nlp_spacy = spacy.load("en_core_web_trf")
except Exception as e:
    import spacy.cli
    spacy.cli.download("en_core_web_trf")
    nlp_spacy = spacy.load("en_core_web_trf")

# -------------------------------
# Initialize HuggingFace NER pipeline
# -------------------------------
nlp_transformers = pipeline("ner", model="dslim/bert-base-NER", aggregation_strategy="simple")

def extract_entities(text: str) -> list:
    """
    Extract named entities from text using an ensemble approach.
    
    Combines entities extracted by spaCy's transformer-based model and
    HuggingFace's transformer pipeline, then deduplicates the results.
    
    Args:
        text (str): The input text to extract entities from.
        
    Returns:
        list: A list of tuples, each tuple containing (entity_text, entity_label).
    """
    # Extract entities using spaCy's transformer model.
    spacy_doc = nlp_spacy(text)
    spacy_entities = [(ent.text, ent.label_) for ent in spacy_doc.ents]
    
    # Extract entities using HuggingFace's NER pipeline.
    hf_results = nlp_transformers(text)
    hf_entities = []
    for res in hf_results:
        entity_text = res.get("word", "")
        # Clean up label by removing any IOB prefixes if present.
        label = res.get("entity_group", res.get("entity", "")).replace("B-", "").replace("I-", "")
        hf_entities.append((entity_text, label))
    
    # Combine and deduplicate entities.
    combined_entities = spacy_entities + hf_entities
    # Using a set to deduplicate based on (entity_text, entity_label)
    unique_entities = list({(ent_text, ent_label) for ent_text, ent_label in combined_entities})
    
    return unique_entities
