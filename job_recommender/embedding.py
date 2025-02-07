# job_recommender/embedding.py

from sentence_transformers import SentenceTransformer, CrossEncoder
import torch

# Check if CUDA is available; if so, set device to "cuda"
device = "cuda" if torch.cuda.is_available() else "cpu"

# Initialize the SentenceTransformer model with the specified device
embedding_model = SentenceTransformer('all-MiniLM-L6-v2', device=device)

# Initialize the CrossEncoder model for re-ranking, also using the chosen device
cross_encoder = CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2', device=device)
