# main.py

import os
os.environ["STREAMLIT_FILE_WATCHER_TYPE"] = "none"

import os
import gdown
import pickle
import random
import numpy as np
from job_recommender import pdf_extractor, text_preprocessing, recommender
import streamlit as st

st.markdown("""
    <style>
    .status-box { transition: opacity 0.5s ease-in-out; font-size: 18px; margin: 15px 0; padding: 10px; border-radius: 5px; background: #f8f9fa; }
    .job-title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
    .job-description { font-size: 16px; line-height: 1.6; color: #555; }
    </style>
    """, unsafe_allow_html=True)

STATUS_MESSAGES = {
    'pdf_processing': [
        "Analyzing document structure...", "Extracting content from PDF...", 
        "Processing document layout...", "Converting PDF to readable format...", 
        "Reading through your CV..."
    ],
    'text_preprocessing': [
        "Understanding your experience...", "Analyzing your skills and qualifications...", 
        "Processing your career history...", "Identifying key professional attributes...", 
        "Examining your expertise..."
    ],
    'matching': [
        "Searching for relevant positions...", "Matching your profile with opportunities...", 
        "Analyzing job market fit...", "Finding your ideal roles...", "Evaluating potential matches..."
    ]
}

def update_status(placeholder, stage):
    placeholder.markdown(f'<div class="status-box">🤔 {random.choice(STATUS_MESSAGES[stage])}</div>', unsafe_allow_html=True)

def download_precomputed_file():
    local_path = 'data/precomputed_index.pkl'
    if not os.path.exists('data'):
        os.makedirs('data')
    if not os.path.exists(local_path):
        st.info("Downloading job database...")
        file_id = "1XtQbINEDpuMXT8kWgOyNC52-mUQlyBKe"
        url = f"https://drive.google.com/uc?id={file_id}"
        gdown.download(url, local_path, quiet=False)

@st.cache_resource(show_spinner=False)
def get_recommender_from_precomputed():
    download_precomputed_file()
    try:
        with open('data/precomputed_index.pkl', 'rb') as f:
            precomputed = pickle.load(f)
        return recommender.JobRecommender(
            precomputed['job_postings'],
            job_embeddings=precomputed['job_embeddings'],
            index=precomputed['index']
        )
    except Exception as e:
        st.error("Failed to load job database. Please try again.")
        return None

def main():
    st.title("Job Recommendation System")
    st.write("Upload your CV (PDF format) to get personalized job recommendations")
    
    uploaded_file = st.file_uploader("Choose a PDF file", type="pdf")
    if uploaded_file is not None:
        status_placeholder = st.empty()
        update_status(status_placeholder, 'pdf_processing')
        extracted_text = pdf_extractor.extract_text_from_pdf(uploaded_file.read())
        if not extracted_text.strip():
            st.error("Could not extract text from PDF. Please try a different file.")
            return
        
        update_status(status_placeholder, 'text_preprocessing')
        processed_text, candidate_entities = text_preprocessing.preprocess_text(extracted_text)
        
        # Display extracted entities for verification
        st.subheader("Extracted Named Entities")
        st.json(candidate_entities)
        
        update_status(status_placeholder, 'matching')
        rec = get_recommender_from_precomputed()
        if rec is None:
            return
        recommendations = rec.recommend(processed_text, candidate_entities)
        status_placeholder.empty()
        
        if recommendations:
            final_scores = np.array([job.get("final_score", 0) for job in recommendations])
            L, k, x0 = 100, 0.1, np.mean(final_scores)
            normalized_final_scores = L / (1 + np.exp(-k * (final_scores - x0)))
            for job, norm in zip(recommendations, normalized_final_scores):
                job["normalized_score"] = norm
            
            st.write("## Recommended Jobs")
            st.info("Match Score is based on semantic similarity, experience, and entity matches.")
            for job in recommendations:
                with st.expander(job['title'], expanded=False):
                    st.markdown(f'<div class="job-title">{job["title"]}</div>', unsafe_allow_html=True)
                    st.markdown(f'<div class="job-description">{job["description"]}</div>', unsafe_allow_html=True)
                    st.markdown(f'<div class="job-description"><b>Match Quality:</b> {job["normalized_score"]:.0f} / 100</div>', unsafe_allow_html=True)
        else:
            st.write("No matching jobs found. Please try with a different CV.")

if __name__ == "__main__":
    main()
