import uvicorn
import os

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8002))
    uvicorn.run(
        "src.api.candidate_main:app",
        host="0.0.0.0",
        port=port,
    )
