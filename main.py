import logging
from fastapi import FastAPI
import inngest
import inngest.fast_api
from dotenv import load_dotenv
import uuid
import os
import datetime
from data_loader import load_and_chunk_pdf, embed_texts
from vector_db import QdrantStorage
from custom_types import RAGChunkAndSrc, RAGUpsertResult, RAGSearchResult, RAGQueryResult
from openai import OpenAI
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, File, UploadFile, HTTPException
from pydantic import BaseModel
import shutil
from pathlib import Path
load_dotenv()

inngest_client = inngest.Inngest(
    app_id = "rag_app",
    logger = logging.getLogger("uvicorn"),
    is_production = False,
    serializer = inngest.PydanticSerializer()

)

@inngest_client.create_function(
    fn_id = "RAG: Ingest PDF",
    trigger = inngest.TriggerEvent(event = "rag/ingest_pdf")
)

async def rag_ingest_pdf(ctx: inngest.Context):
    def _load(ctx: inngest.Context) -> RAGChunkAndSrc:
        pdf_path = ctx.event.data["pdf_path"]
        source_id = ctx.event.data.get("source_id", pdf_path)
        chunks = load_and_chunk_pdf(pdf_path)
        return RAGChunkAndSrc(chunks = chunks, source_id = source_id)

    def _upsert(chunks_and_src: RAGChunkAndSrc) -> RAGUpsertResult:
        chunks = chunks_and_src.chunks
        source_id = chunks_and_src.source_id
        vec = embed_texts(chunks)
        ids = [str(uuid.uuid5(uuid.NAMESPACE_URL, f"{source_id}:{i}")) for i in range(len(chunks))]
        payloads = [{"source": source_id, "text": chunks[i]} for i in range(len(chunks))]
        QdrantStorage().upsert(ids, vec, payloads)
            
        return RAGUpsertResult(ingested = len(chunks))

        
    
    chunks_and_src = await ctx.step.run("load-and-chunk", lambda: _load(ctx), output_type = RAGChunkAndSrc)
    ingested = await ctx.step.run("embed-and-upsert", lambda: _upsert(chunks_and_src), output_type = RAGUpsertResult)
    return ingested.model_dump()

@inngest_client.create_function(
    fn_id = "RAG: Query PDF",
    trigger=inngest.TriggerEvent(event="rag/query_pdf_ai")
)

async def rag_query_pdf_ai(ctx: inngest.Context):
    def _search(question: str, top_k: int=5) -> RAGSearchResult:
        query_vec = embed_texts([question])[0]
        store = QdrantStorage()
        found = store.search(query_vec, top_k)
        return RAGSearchResult(contexts=found["contexts"], sources=found["sources"])
    
    question = ctx.event.data["question"]
    top_k=int(ctx.event.data.get("top_k", 5))

    found = await ctx.step.run("embed-and-search", lambda: _search(question, top_k), output_type=RAGSearchResult)

    context_block = "\n\n".join(f"- {c}" for c in found.contexts)
    user_content = (
        "Use the following context to answer the question. \n\n"
        f"Context: \n{context_block}\n\n"
        f"Question: {question}\n"
        "Answer precisely using the context above."
    )

    # We create a standard python function to call the NVIDIA LLM
    def _generate_answer():
        client = OpenAI(
            api_key=os.environ["NVIDIA_API_KEY"],
            base_url="https://integrate.api.nvidia.com/v1"
        )
        
        response = client.chat.completions.create(
            model="meta/llama-3.3-70b-instruct", 
            messages=[
                {"role": "system", "content": "You answer questions using only the provided context."},
                {"role": "user", "content": user_content}
            ],
            max_tokens=1024,
            temperature=0.2
        )
        # Extract the text content from the response
        return response.choices[0].message.content.strip()

    # Wrap it in ctx.step.run() so Inngest tracks it and retries it if it fails
    answer = await ctx.step.run("llm-answer", _generate_answer)

    return RAGQueryResult(
        answer=answer, 
        sources=found.sources, 
        num_contexts=len(found.contexts)
    ).model_dump()
    



app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    question: str
    top_k: int = 5

@app.post("/api/upload")
async def upload_pdf(file: UploadFile = File(...)):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    upload_dir = Path("uploads")
    upload_dir.mkdir(exist_ok=True)
    file_path = upload_dir / file.filename
    
    with file_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    await inngest_client.send(
        inngest.Event(
            name="rag/ingest_pdf",
            data={"pdf_path": str(file_path), "source_id": file.filename}
        )
    )
    return {"status": "success", "message": "PDF uploaded and ingestion started."}

@app.post("/api/chat")
async def chat(request: ChatRequest):
    # Execute the RAG logic synchronously for real-time UI response
    query_vec = embed_texts([request.question])[0]
    store = QdrantStorage()
    found = store.search(query_vec, request.top_k)
    
    if not found["contexts"]:
        return {"answer": "I don't have any context to answer that.", "sources": [], "num_contexts": 0}
        
    context_block = "\n\n".join(f"- {c}" for c in found["contexts"])
    user_content = (
        "Use the following context to answer the question. \n\n"
        f"Context: \n{context_block}\n\n"
        f"Question: {request.question}\n"
        "Answer precisely using the context above."
    )
    
    client = OpenAI(
        api_key=os.environ["NVIDIA_API_KEY"],
        base_url="https://integrate.api.nvidia.com/v1"
    )
    
    response = client.chat.completions.create(
        model="meta/llama-3.3-70b-instruct", 
        messages=[
            {"role": "system", "content": "You answer questions using only the provided context."},
            {"role": "user", "content": user_content}
        ],
        max_tokens=1024,
        temperature=0.2
    )
    
    answer = response.choices[0].message.content.strip()
    return {"answer": answer, "sources": found["sources"], "num_contexts": len(found["contexts"])}

inngest.fast_api.serve(app, inngest_client, [rag_ingest_pdf,rag_query_pdf_ai])