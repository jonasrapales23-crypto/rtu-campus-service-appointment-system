import joblib
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="RTU-CCSAS NLP Service")
model = joblib.load("model.joblib")
THRESHOLD = 0.4

class Query(BaseModel):
    text: str

@app.get("/")
def home():
    return {"status": "ok"}

@app.post("/search")
def search(q: Query):
    text = q.text.lower().strip()
    if not text:
        return {"query": q.text, "results": [], "confident": False}
    probs = model.predict_proba([text])[0]
    ranked = probs.argsort()[::-1]
    results = [
        {"service": str(model.classes_[i]), "confidence": round(float(probs[i]), 2)}
        for i in ranked
        if model.classes_[i] != "Other"
    ][:3]
    top = ranked[0]
    confident = model.classes_[top] != "Other" and float(probs[top]) >= THRESHOLD
    return {"query": q.text, "results": results, "confident": confident}
