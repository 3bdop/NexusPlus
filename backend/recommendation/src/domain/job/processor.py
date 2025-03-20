# src/domain/job/processor.py

import logging
from tqdm import tqdm
from sentence_transformers import SentenceTransformer
from src.utils.text_utils import process_text

model = SentenceTransformer('all-MiniLM-L6-v2')

def process_job_postings(postings: list) -> list:
    """
    Process a list of job postings by cleaning and lemmatizing the text fields.
    """
    processed_postings = []
    for posting in tqdm(postings, desc="Processing job postings"):
        job_id = posting.get('id')
        title = posting.get('title', '')
        description = posting.get('description', '')
        experience = posting.get('experience', '')

        processed_title = process_text(title)
        processed_description = process_text(description)

        processed_postings.append({
            'id': job_id,
            'title': processed_title,
            'description': processed_description,
            'experience': experience
        })

    logging.info(f"Processed {len(processed_postings)} job postings.")
    return processed_postings

def embed_job_postings(processed_postings: list) -> list:
    """
    Generate embeddings for each job posting using the Sentence Transformer model.
    """
    postings_with_embeddings = []
    for posting in tqdm(processed_postings, desc="Embedding job postings"):
        text_to_embed = posting.get('title', '') + " " + posting.get('description', '')
        embedding = model.encode(text_to_embed).tolist()
        posting['embedding'] = embedding
        postings_with_embeddings.append(posting)
    logging.info(f"Generated embeddings for {len(postings_with_embeddings)} job postings.")
    return postings_with_embeddings
