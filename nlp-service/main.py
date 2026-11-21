import datetime as dt
import io
from PIL import Image
from typing import List, Optional

import joblib
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from pydantic import BaseModel

from email_check import check_email
from forecast import make_forecast
from doc_check import check_document

app = FastAPI(title="RTU-CCSAS NLP Service")
model = joblib.load("model.joblib")
THRESHOLD = 0.4


class Query(BaseModel):
    text: str


class EmailQuery(BaseModel):
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None


class Point(BaseModel):
    date: dt.date
    count: int


class ForecastQuery(BaseModel):
    history: List[Point]
    days_ahead: int = 7
    capacity: Optional[int] = None


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


@app.post("/check-email")
def check_email_endpoint(q: EmailQuery):
    return check_email(q.email, q.first_name, q.last_name)


@app.post("/forecast")
def forecast_endpoint(q: ForecastQuery):
    if len(q.history) < 7:
        raise HTTPException(status_code=400, detail="Need at least 7 days of history")
    if not 1 <= q.days_ahead <= 14:
        raise HTTPException(status_code=400, detail="days_ahead must be 1 to 14")
    history = [(p.date, p.count) for p in q.history]
    return {
        "method": "Average of the same weekday over recent weeks",
        "days_of_history": len(history),
        "forecast": make_forecast(history, q.days_ahead, q.capacity),
    }

MAX_BYTES = 5 * 1024 * 1024

@app.post("/verify-document")
def verify_document(
    expected: str = Form(...),
    names: str = Form(...),
    file: UploadFile = File(...),
):

    if expected not in ("valid_id", "authorization letter"):
        raise HTTPException(status_code=400, detail="expected must be valid_id or authorization letter")
    data = file.file.read(MAX_BYTES + 1)
    if len(data) > MAX_BYTES:
        raise HTTPException(status_code=413, detail="File is larger than 5MB")
    name_list = [n.strip() for n in names.split(",") if n.strip()]
    if not name_list:
        raise HTTPException(status_code=400, detail="At least one name must be provided")
    try:
        fmt = Image.open(io.BytesIO(data)).format
    except Exception:
        fmt = None
    if fmt not in ("JPEG", "PNG"):
        raise HTTPException(status_code=400, detail="Only JPG or PNG images are accepted")
    try:
        return check_document(data, expected, name_list)
    except Exception:
        raise HTTPException(status_code=400, detail="Could not read image")