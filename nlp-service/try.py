import joblib

model = joblib.load("model.joblib")
tests = [
    ("pa-print ng reg form", "Registration Form"),
    ("gusto ko kumuha ng tor", "Transcript of Records"),
    ("masakit po ngipin ko", "Dental Consultation"),
    ("magpapa-check up ako", "Medical Consultation"),
    ("saan makakabili ng sablay", "Sablay"),
    ("claim ng diploma", "Diploma"),
    ("kailangan ko ng ctc ng grades", "CTC / Authentication"),
    ("dental exam for first year", "Dental Examination"),
    ("saan makakabili ng uniform", "Uniform"),
    ("hello po", "Other"),
    ("what is the weather today", "Other"),
    ("qwerty", "Other"),
]
ok = 0
for text, expected in tests:
    probs = model.predict_proba([text.lower()])[0]
    best = probs.argmax()
    got = model.classes_[best]
    ok += got == expected
    print("OK " if got == expected else "XX ", text, "->", got, round(float(probs[best]), 2))
print(ok, "of", len(tests), "correct")