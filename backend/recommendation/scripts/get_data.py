# scripts/get_data.py

import pandas as pd

def load_job_postings_from_csv(csv_path='data/postings.csv') -> list:
    """
    Load job postings from a CSV file using columns: 'title', 'description', 'formatted_experience_level'.
    """
    df = pd.read_csv(csv_path)
    df = df.dropna(subset=['title', 'description', 'formatted_experience_level'])
    postings = []
    for idx, row in df.iterrows():
        postings.append({
            'id': idx,
            'title': row['title'],
            'description': row['description'],
            'experience': row['formatted_experience_level']
        })
    return postings
