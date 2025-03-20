# tests/test_data.py

from scripts.get_data import load_job_postings_from_csv

def main():
    postings = load_job_postings_from_csv(csv_path='data/postings.csv')
    print(f"Loaded {len(postings)} job postings.")
    if postings:
        print("First posting:", postings[0])

if __name__ == '__main__':
    main()
