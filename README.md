The three command to run in terminal:

uv run uvicorn main:app

npx inngest-cli@latest dev -u http://127.0.0.1:8000/api/inngest --no-discovery

docker run -d --name qdrantDB -p 6333:6333 -v "$(pwd)/qdrant_storage:/qdrant/storage" qdrant/qdrant  