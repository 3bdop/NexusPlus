# job_recommender/pdf_extractor.py

import fitz  # PyMuPDF
from PIL import Image
import pytesseract
import streamlit as st

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """
    Extracts text from a PDF. Falls back to OCR if the extracted text is too short.
    """
    extracted_text = ""
    try:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        for page in doc:
            extracted_text += page.get_text("text") + "\n"
    except Exception as e:
        st.error(f"Error reading PDF: {e}")

    if len(extracted_text.strip()) < 100:
        st.info("Low text extraction detected. Falling back to OCR...")
        extracted_text = ocr_pdf(file_bytes)
    return extracted_text

def ocr_pdf(file_bytes: bytes) -> str:
    """
    Uses Tesseract to perform OCR on a PDF file.
    """
    ocr_text = ""
    try:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        for page in doc:
            pix = page.get_pixmap()
            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
            ocr_text += pytesseract.image_to_string(img) + "\n"
    except Exception as e:
        st.error(f"OCR extraction failed: {e}")
    return ocr_text
