# tests/test_cv.py

import os
from src.config import GEMINI_API_KEY
from src.domain.cv.processor import extract_text_from_pdf, process_cv_text, get_cv_embedding
from src.domain.cv.ner import extract_skills_with_gemini

def main():
    # 1) Path to your local CV PDF file.
    cv_file_path = "D:/montasar_space/MontasarDridiResume.pdf"  # <-- Update this path

    # 2) Check if file exists
    if not os.path.exists(cv_file_path):
        print(f"CV file not found at {cv_file_path}")
        return

    try:
        # 3) Read the CV bytes
        with open(cv_file_path, "rb") as f:
            file_bytes = f.read()

        # 4) Extract text from the CV PDF
        print("Extracting text from CV...")
        cv_text = extract_text_from_pdf(file_bytes)
        print("Extracted text (first 500 characters):")
        print(cv_text[:500])

        # 5) Process the extracted text
        print("\nProcessing extracted text...")
        processed_text = process_cv_text(cv_text)
        print("Processed text (first 500 characters):")
        print(processed_text[:500])

        # 6) Generate the CV embedding
        print("\nGenerating CV embedding...")
        cv_embedding = get_cv_embedding(processed_text)
        print(f"CV embedding (length={len(cv_embedding)}):")
        print(cv_embedding)

        # 7) Test skill extraction with Gemini
        if not GEMINI_API_KEY:
            print("\nNo GEMINI_API_KEY found. Please set it in your .env file.")
        else:
            print("\nExtracting skills from CV using Gemini NER...")
            cv_skills = extract_skills_with_gemini(cv_text, GEMINI_API_KEY)
            print("Extracted CV Skills:")
            if cv_skills:
                for skill in cv_skills:
                    print(f" - {skill}")
            else:
                print("No skills were extracted.")

    except Exception as e:
        print("An error occurred during processing:", e)

if __name__ == "__main__":
    main()
