from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="UAG Demo API")

class MergeRequest(BaseModel):
    texts: list[str]
    mode: str = "synthesis"

@app.post("/merge")
def merge(req: MergeRequest):
    combined = "\n---\n".join(req.texts)
    return {"mode": req.mode, "result": f"[merged {len(req.texts)} sources]\n{combined[:500]}"}

@app.get("/health")
def health():
    return {"status": "ok", "service": "uag"}
