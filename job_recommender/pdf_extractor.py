# job_recommender/pdf_extractor.py

import fitz  # PyMuPDF
from PIL import Image
import pytesseract
import streamlit as st

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """
    Extract text from a PDF using PyMuPDF.
    Falls back to OCR if the extracted text is insufficient.
    """
    extracted_text = ""
    try:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            page_text = page.get_text("text")
            extracted_text += page_text + "\n"
    except Exception as e:
        st.error(f"Error reading PDF: {e}")
    
    # If extracted text is too short, assume the PDF is image-based
    if len(extracted_text.strip()) < 100:
        st.info("Low text extraction detected. Falling back to OCR...")
        extracted_text = ocr_pdf(file_bytes)
    
    return extracted_text

def ocr_pdf(file_bytes: bytes) -> str:
    """
    Fallback OCR extraction using Tesseract.
    Converts each page of the PDF to an image and extracts text.
    """
    ocr_text = ""
    try:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            pix = page.get_pixmap()
            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
            text = pytesseract.image_to_string(img)
            ocr_text += text + "\n"
    except Exception as e:
        st.error(f"OCR extraction failed: {e}")
    return ocr_text
