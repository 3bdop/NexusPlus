import uvicorn
import os

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8001))
    uvicorn.run(
        "src.api.main:app",
        host="0.0.0.0",
        port=port,
    )
