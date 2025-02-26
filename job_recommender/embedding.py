# job_recommender/embedding.py

from sentence_transformers import SentenceTransformer, CrossEncoder
import torch

# Set device and load models
device = "cuda" if torch.cuda.is_available() else "cpu"
embedding_model = SentenceTransformer('all-MiniLM-L6-v2', device=device)
cross_encoder = CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2', device=device)
