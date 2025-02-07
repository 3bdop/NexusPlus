# main.py (or a utility module)
import os
import gdown
import pickle
from job_recommender import pdf_extractor, text_preprocessing, recommender
import streamlit as st

# Function to download the file from Google Drive if not present
def download_precomputed_file():
    local_path = 'data/precomputed_index.pkl'
    # Ensure the 'data' directory exists
    if not os.path.exists('data'):
        os.makedirs('data')
        st.info("Created 'data' directory.")
        
    if not os.path.exists(local_path):
        st.info("Downloading precomputed index from Google Drive...")
        # Replace with your actual file ID from Google Drive
        file_id = "1XtQbINEDpuMXT8kWgOyNC52-mUQlyBKe"
        url = f"https://drive.google.com/uc?id={file_id}"
        gdown.download(url, local_path, quiet=False)
    else:
        st.info("Precomputed index already exists locally.")

@st.cache_resource(show_spinner=True)
def get_recommender_from_precomputed():
    # Ensure the file is present by downloading it if needed
    download_precomputed_file()

    precomputed_path = 'data/precomputed_index.pkl'
    if os.path.exists(precomputed_path):
        with open(precomputed_path, 'rb') as f:
            precomputed = pickle.load(f)
        return recommender.JobRecommender(
            precomputed['job_postings'],
            job_embeddings=precomputed['job_embeddings'],
            index=precomputed['index']
        )
    else:
        st.error("Precomputed data not found. Please check the download process.")
        return None

def main():
    st.title("Job Recommendation System")
    st.write("Upload your CV (in PDF format) to receive personalized job recommendations.")
    
    uploaded_file = st.file_uploader("Choose a PDF file", type="pdf")
    if uploaded_file is not None:
        file_bytes = uploaded_file.read()
        
        st.info("Extracting text from PDF...")
        extracted_text = pdf_extractor.extract_text_from_pdf(file_bytes)
        if not extracted_text or len(extracted_text.strip()) == 0:
            st.error("No text could be extracted from the PDF. Please try a different file.")
            return
        
        st.success("Text extraction complete!")
        st.write("### Extracted Text Preview:")
        st.text(extracted_text[:1000] + " ...")
        
        st.info("Preprocessing text and extracting entities...")
        processed_text, entities = text_preprocessing.preprocess_text(extracted_text)
        st.success("Text preprocessing complete!")
        
        if entities:
            st.write("### Extracted Entities:")
            st.write(entities)
        else:
            st.write("No significant entities detected.")
        
        st.info("Loading precomputed recommendation index...")
        rec = get_recommender_from_precomputed()
        if rec is None:
            st.error("Failed to load precomputed job postings dataset.")
            return
        st.success("Precomputed job postings loaded and index ready!")
        
        st.info("Computing job recommendations...")
        recommendations = rec.recommend(processed_text)
        st.success("Recommendations computed!")
        
        if recommendations:
            st.write("## Recommended Jobs:")
            for rec_job in recommendations:
                st.markdown(f"**{rec_job['title']}** (Score: {rec_job['score']:.2f})")
                st.write(rec_job['description'])
                st.markdown("---")
        else:
            st.write("No recommendations found. Please try with a different CV.")

if __name__ == "__main__":
    main()
