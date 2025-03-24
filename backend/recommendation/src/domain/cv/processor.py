# src/domain/cv/processor.py

import fitz  # PyMuPDF
from PIL import Image
import pytesseract
import logging
import numpy as np
from sentence_transformers import SentenceTransformer
from src.utils.text_utils import process_text

# Initialize the SentenceTransformer model once at import time
embedding_model = SentenceTransformer('all-MiniLM-L6-v2')

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """
    Extract text from a PDF file. If the text is too short, fall back to OCR.
    """
    extracted_text = ""
    try:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        for page in doc:
            extracted_text += page.get_text("text") + "\n"
    except Exception as e:
        logging.error(f"Error reading PDF: {e}")
        raise ValueError(f"Error reading PDF: {e}")
    
    if len(extracted_text.strip()) < 100:
        logging.info("Low text extraction detected. Falling back to OCR...")
        extracted_text = ocr_pdf(file_bytes)
    return extracted_text

def ocr_pdf(file_bytes: bytes) -> str:
    """
    Uses Tesseract OCR to extract text from a PDF file.
    """
    ocr_text = ""
    try:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        for page in doc:
            pix = page.get_pixmap()
            img = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
            ocr_text += pytesseract.image_to_string(img) + "\n"
    except Exception as e:
        logging.error(f"OCR extraction failed: {e}")
        raise ValueError(f"OCR extraction failed: {e}")
    return ocr_text

def process_cv_text(text: str) -> str:
    """
    Processes CV text by cleaning and lemmatizing it.
    """
    return process_text(text)

def get_cv_embedding(cv_text: str) -> np.ndarray:
    """
    Computes and returns an embedding for the provided CV text.
    """
    return embedding_model.encode(cv_text)
