# Use official Python base image
FROM python:3.9-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    python3-dev \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Set work directory
WORKDIR /app

# Copy requirements first to leverage Docker cache
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project files
COPY .env .
COPY src/ ./src/

# Expose the port your app runs on (adjust if needed)
EXPOSE 8000

# Command to run the job seeker API
CMD ["uvicorn", "src.api.main:app", "--host", "0.0.0.0", "--port", "8000"]