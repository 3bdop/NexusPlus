# main.py

import os
os.environ["STREAMLIT_FILE_WATCHER_TYPE"] = "none"

import os
import gdown
import pickle
import random
from job_recommender import pdf_extractor, text_preprocessing, recommender
import streamlit as st

# Custom CSS with simplified styling
st.markdown("""
    <style>
    .status-box {
       transition: opacity 0.5s ease-in-out;
       font-size: 18px;
       margin: 15px 0;
       padding: 10px;
       border-radius: 5px;
       background: #f8f9fa;
    }
    .job-title {
       font-size: 24px;
       font-weight: bold;
       margin-bottom: 10px;
    }
    .job-description {
       font-size: 16px;
       line-height: 1.6;
       color: #555;
    }
    </style>
    """, unsafe_allow_html=True)

# Status message variations for each step
STATUS_MESSAGES = {
    'pdf_processing': [
        "Analyzing document structure...",
        "Extracting content from PDF...",
        "Processing document layout...",
        "Converting PDF to readable format...",
        "Reading through your CV..."
    ],
    'text_preprocessing': [
        "Understanding your experience...",
        "Analyzing your skills and qualifications...",
        "Processing your career history...",
        "Identifying key professional attributes...",
        "Examining your expertise..."
    ],
    'matching': [
        "Searching for relevant positions...",
        "Matching your profile with opportunities...",
        "Analyzing job market fit...",
        "Finding your ideal roles...",
        "Evaluating potential matches..."
    ]
}

def update_status(placeholder, stage):
    """Display a random status message for the current processing stage."""
    message = random.choice(STATUS_MESSAGES[stage])
    placeholder.markdown(
        f'<div class="status-box">🤔 {message}</div>',
        unsafe_allow_html=True
    )

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
        
        # Step 1: Extract text from PDF
        update_status(status_placeholder, 'pdf_processing')
        extracted_text = pdf_extractor.extract_text_from_pdf(uploaded_file.read())
        if not extracted_text.strip():
            st.error("Could not extract text from PDF. Please try a different file.")
            return
        
        # Step 2: Preprocess text
        update_status(status_placeholder, 'text_preprocessing')
        processed_text, _ = text_preprocessing.preprocess_text(extracted_text)
        
        # Step 3: Get recommendations
        update_status(status_placeholder, 'matching')
        rec = get_recommender_from_precomputed()
        if rec is None:
            return
            
        recommendations = rec.recommend(processed_text)
        status_placeholder.empty()
        
        # === CHANGES START: Normalize adjusted match scores for user-friendly display ===
        if recommendations:
            # Get the adjusted scores (if not present, fallback to the original score)
            adjusted_scores = [job.get("adjusted_score", job.get("score", 0)) for job in recommendations]
            min_score, max_score = min(adjusted_scores), max(adjusted_scores)
            for job in recommendations:
                # Normalize to a 0-100 scale; add a tiny constant to avoid division by zero.
                normalized = (job.get("adjusted_score", job.get("score", 0)) - min_score) / (max_score - min_score + 1e-8) * 100
                job["normalized_score"] = normalized
        # === CHANGES END ===
        
        # Step 4: Display recommendations
        if recommendations:
            st.write("## Recommended Jobs")
            st.info("Note:  Match Score accounts for both the similarity between your CV and job description and an experience adjustment. higher values indicating a better match.")
            for job in recommendations:
                with st.expander(job['title'], expanded=False):
                    st.markdown(f'<div class="job-title">{job["title"]}</div>', unsafe_allow_html=True)
                    st.markdown(f'<div class="job-description">{job["description"]}</div>', unsafe_allow_html=True)
                    # === CHANGES: Display both the raw adjusted score and normalized match quality ===
                    st.markdown(
                        f'<div class="job-description"><b>Match Quality:</b> {job["normalized_score"]:.0f} / 100</div>',
                        unsafe_allow_html=True
                    )
        else:
            st.write("No matching jobs found. Please try with a different CV.")

if __name__ == "__main__":
    main()
