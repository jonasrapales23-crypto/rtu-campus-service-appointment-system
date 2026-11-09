import datetime as dt
from typing import List, Optional

import joblib
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from email_check import check_email
from forecast import make_forecast

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