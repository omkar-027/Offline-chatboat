import os
from llama_index.core import VectorStoreIndex, SimpleDirectoryReader
from llama_index.embeddings.ollama import OllamaEmbedding
from llama_index.llms.ollama import Ollama
from llama_index.core.settings import Settings

# ✅ Use lightweight model
embed_model = OllamaEmbedding(model_name="tinyllama")
llm_model = Ollama(model="tinyllama")

Settings.embed_model = embed_model
Settings.llm = llm_model


def create_vector_index(directory_path):
    documents = SimpleDirectoryReader(directory_path).load_data()
    index = VectorStoreIndex.from_documents(documents, embed_model=embed_model)
    return index


def search_from_index(index, query: str):
    """Strict keyword-based search first. If found, return directly without LLM."""
    folder = "data/"
    results = []

    # --- Step 1: Exact keyword lookup ---
    for filename in os.listdir(folder):
        if filename.endswith(".txt"):
            path = os.path.join(folder, filename)
            with open(path, "r", encoding="utf-8") as f:
                content = f.read()
                if query.lower() in content.lower():
                    for line in content.splitlines():
                        if query.lower() in line.lower():
                            results.append(line.strip())

    if results:
        return "\n".join(results)   # ✅ Always return file match (deterministic)

    # --- Step 2: (Optional) Only if nothing found, fallback to LLM ---
    query_engine = index.as_query_engine()
    response = query_engine.query(query)
    return str(response)
