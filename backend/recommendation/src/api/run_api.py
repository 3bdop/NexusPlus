# import multiprocessing
# import uvicorn
# import os
# import time

# def run_job_recommender_api():
#     """Run the job recommendation API on port 8000."""
#     uvicorn.run("src.api.main:app", host="0.0.0.0", port=8000, reload=False)

# def run_candidate_recommender_api():
#     """Run the candidate recommendation API on port 8001."""
#     uvicorn.run("src.api.candidate_main:app", host="0.0.0.0", port=8001, reload=False)

# if __name__ == "__main__":
#     # Create process for each API
#     job_api_process = multiprocessing.Process(target=run_job_recommender_api)
#     candidate_api_process = multiprocessing.Process(target=run_candidate_recommender_api)
    
#     # Start both APIs
#     print("Starting Job Recommendation API on port 8000...")
#     job_api_process.start()
    
#     print("Starting Candidate Recommendation API on port 8001...")
#     candidate_api_process.start()
    
#     print("\n===== Recommendation APIs =====")
#     print("Job Recommendation API: http://localhost:8000")
#     print("Candidate Recommendation API: http://localhost:8001")
    
#     try:
#         # Keep the main process running
#         while True:
#             time.sleep(1)
#     except KeyboardInterrupt:
#         # Handle Ctrl+C gracefully
#         print("\nShutting down APIs...")
#         job_api_process.terminate()
#         candidate_api_process.terminate()
        
#         # Wait for processes to terminate
#         job_api_process.join()
#         candidate_api_process.join()
#         print("APIs have been shut down.")


import os
import uvicorn
from main import app  # Import from the same directory

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8001))
    uvicorn.run(
        "src.api.main:app",
        host="0.0.0.0",
        port=port,
        reload=os.environ.get("DEBUG", "false").lower() == "true",
        workers=int(os.environ.get("WORKERS", "2"))
