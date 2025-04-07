import uvicorn
import os

if __name__ == "__main__":
    uvicorn.run(
        "src.api.candidate_main:app",
        host="0.0.0.0",
        port=8001,
    )
