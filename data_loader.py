#Llama_index to load in documents and create an index (create vectors)
import os
from openai import OpenAI
from llama_index.readers.file import PDFReader
from llama_index.core.node_parser import SentenceSplitter
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(
    base_url="https://integrate.api.nvidia.com/v1",
    api_key=os.environ["NVIDIA_API_KEY"]
)
EMBEDDING_MODEL = "nvidia/nv-embed-v1"
EMBEDDING_DIM = 4096

splitter = SentenceSplitter(chunk_size=1000, chunk_overlap=200)

#CHUNCKING PDFS
def load_and_chunk_pdf(path: str):
    docs = PDFReader().load_data(file=path)
    texts = [d.text for d in docs if getattr(d, "text", None)]
    chunks = []

    for t in texts:
        chunks.extend(splitter.split_text(t))

    return chunks

#EMBDDING = MAKING VECTORS OF THE CHUNCKED DATA

def embed_texts(texts: list[str]) -> list[list[float]]:
    response = client.embeddings.create(
        model = EMBEDDING_MODEL,
        input = texts,
    )
    return [item.embedding for item in response.data]



