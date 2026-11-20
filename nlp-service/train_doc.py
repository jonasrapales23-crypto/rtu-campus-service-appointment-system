import csv
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report
from sklearn.model_selection import cross_val_predict
from sklearn.pipeline import make_pipeline

texts, labels = [], []
with open ("docs_data.csv", encoding="utf-8") as f:
    for row in csv.DictReader(f):
        texts.append(row["text"].lower().strip())
        labels.append(row["label"])

model = make_pipeline(
    TfidfVectorizer(analyzer="char_wb", ngram_range=(3, 5)),
    LogisticRegression(C=20, max_iter=1000, class_weight="balanced"),
)

predicted = cross_val_predict(model, texts, labels, cv=5)
print(classification_report(labels, predicted, zero_division=0))

model.fit(texts, labels)
joblib.dump(model, "doc_model.joblib")
print("Saved doc_model.joblib trained on", len(texts), "examples")