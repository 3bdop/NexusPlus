# scripts/get_data.py

import pandas as pd

def load_job_postings_from_csv(csv_path='data/postings.csv') -> list:
    """
    Load job postings from a CSV file using columns: 'title', 'description', 'formatted_experience_level'.
    """
    df = pd.read_csv(csv_path)
    df = df.dropna(subset=['Title', 'Company', 'Experience Level', 'Description'])
    postings = []
    for idx, row in df.iterrows():
        postings.append({
            'title': row['Title'],
            'company': row['Company'],
            'description': row['Description'],
            'experience': row['Experience Level']
        })
    return postings
