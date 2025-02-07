# precompute.py

import os
import pickle
import pandas as pd
import numpy as np
import faiss
import torch
from job_recommender.embedding import embedding_model

def load_job_postings_from_csv(csv_path='data/postings.csv') -> list:
    """
    Load job postings from the CSV file using the columns 'title' and 'description'.
    """
    df = pd.read_csv(csv_path)
    # Drop rows with missing title or description
    df = df.dropna(subset=['title', 'description'])
    postings = []
    for idx, row in df.iterrows():
        posting = {
            'id': idx,
            'title': row['title'],
            'description': row['description']
        }
        postings.append(posting)
    return postings

def precompute():
    print("Loading job postings...")
    job_postings = load_job_postings_from_csv()
    job_texts = [job['title'] + ". " + job['description'] for job in job_postings]
    
    # Move model to GPU and convert to half precision if CUDA is available
    if torch.cuda.is_available():
        embedding_model.to('cuda')
        embedding_model.half()
    else:
        print("CUDA not available, using CPU.")
    
    print("Computing embeddings...")
    with torch.no_grad():
        embeddings = embedding_model.encode(
            job_texts,
            batch_size=128,  # Adjust based on your GPU memory
            convert_to_numpy=True,
            show_progress_bar=True
        )
    
    # Normalize the embeddings
    norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
    embeddings = embeddings / norms
    
    dimension = embeddings.shape[1]
    print("Building FAISS index...")
    index = faiss.IndexFlatIP(dimension)
    index.add(embeddings)
    
    precomputed = {
        'job_postings': job_postings,
        'job_embeddings': embeddings,
        'index': index
    }
    
    output_path = 'data/precomputed_index.pkl'
    with open(output_path, 'wb') as f:
         pickle.dump(precomputed, f)
    print(f"Precomputed data saved to {output_path}")

if __name__ == "__main__":
    precompute()
