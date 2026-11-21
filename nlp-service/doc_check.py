import io 
import re
import csv
import os

import joblib
import pytesseract
from PIL import Image, ImageOps
from rapidfuzz import fuzz

doc_model = joblib.load("doc_model.joblib")
NAME_THRESHOLD = 85
TYPE_THRESHOLD = 0.5
MIN_CHARS = 30
LABEL = {"valid_id": "valid ID", "authorization_letter": "authorization letter"}

def read_text(data):
  img = Image.open(io.BytesIO(data))
  img = ImageOps.exif_transpose(img).convert("L")
  if img.width < 1000:
    img = img.resize((1000, int(img.height * 1000 / img.width)))
  img = ImageOps.autocontrast(img)
  return pytesseract.image_to_string(img)

def clean(text):
  return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9' ]", " ", text.lower())).strip()

def _label_words():
    path = os.path.join(os.path.dirname(__file__), "docs_data.csv")
    words = set()
    with open(path, encoding="utf-8") as f:
        for row in csv.DictReader(f):
            words.update(re.findall(r"[a-z]+", row["text"].lower()))
    return words


LABEL_WORDS = _label_words()


def name_score(name, text):
    words = {w for w in re.findall(r"[a-z]+", text.lower())
             if len(w) >= 3 and w not in LABEL_WORDS}
    tokens = [t for t in re.findall(r"[a-z]+", name.lower()) if len(t) >= 3]
    if not tokens or not words:
        return 0
    scores = []
    for t in tokens:
        near = [w for w in words if abs(len(w) - len(t)) <= 2]
        scores.append(max((fuzz.ratio(t, w) for w in near), default=0))
    return min(scores)

def check_document(data, expected, names):
  cleaned = clean(read_text(data))
  if len(cleaned) < MIN_CHARS:
    return {"verdict": "rejected", "readable": False, 
            "reasons": ["The text could not be read. Upload a clearer image."]}

  probs = doc_model.predict_proba([cleaned])[0]
  best = probs.argmax()
  detected, conf = str(doc_model.classes_[best]), round(float(probs[best]), 2)

  reasons = []
  if detected != expected or conf < TYPE_THRESHOLD:
    reasons.append(f"This does not look like a {LABEL[expected]}.")
  scores = [{"name": n, "score": name_score(n, cleaned)} for n in names]
  if any(s["score"] < NAME_THRESHOLD for s in scores):
    reasons.append("The name on the document does not match the expected name.")

  return {"verdict": "accepted" if not reasons else "rejected",
          "readable": True, "detected_type": detected,
          "type_confidence": conf, "name_scores": scores, "reasons": reasons}