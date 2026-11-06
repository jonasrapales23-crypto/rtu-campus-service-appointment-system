import re
from email_validator import validate_email, EmailNotValidError
from rapidfuzz import fuzz

DISPOSABLE = {
    "mailinator.com", "10minutemail.com", "guerrillamail.com",
    "tempmail.com", "temp-mail.org", "yopmail.com",
    "trashmail.com", "sharklasers.com", "getnada.com",
}
KEYBOARD = ("qwert", "asdf", "zxcv", "hjkl", "uiop")


def _letters(text):
    return re.sub(r"[^a-z]", "", (text or "").lower())


def _looks_random(local):
    s = _letters(local)
    if len(s) < 3:
        return True
    if not any(c in "aeiou" for c in s):
        return True
    if re.search(r"(.)\1{3,}", s):
        return True
    return any(k in s for k in KEYBOARD)


def _name_score(local, first, last):
    l, f, n = _letters(local), _letters(first), _letters(last)
    candidates = [x for x in (f + n, n + f, f[:1] + n, f + n[:1], n, f) if len(x) >= 3]
    if not l or not candidates:
        return None
    return round(max(fuzz.partial_ratio(l, c) for c in candidates))


def check_email(email, first_name=None, last_name=None):
    try:
        v = validate_email(email, check_deliverability=False)
    except EmailNotValidError as e:
        return {"email": email, "valid_format": False,
                "verdict": "reject", "reasons": [str(e)]}

    reasons = []
    disposable = v.domain.lower() in DISPOSABLE
    random_ = _looks_random(v.local_part)
    score = _name_score(v.local_part, first_name, last_name)

    verdict = "ok"
    if disposable:
        verdict = "reject"
        reasons.append("Disposable email domain")
    else:
        if random_:
            verdict = "review"
            reasons.append("Address looks random")
        if score is not None and score < 50:
            verdict = "review"
            reasons.append("Address does not resemble the student's name")

    return {"email": v.normalized, "valid_format": True, "disposable": disposable,
            "looks_random": random_, "name_match_score": score,
            "verdict": verdict, "reasons": reasons}