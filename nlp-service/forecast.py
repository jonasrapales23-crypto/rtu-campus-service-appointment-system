from datetime import timedelta
from statistics import mean


def make_forecast(history, days_ahead=7, capacity=None):
    history = sorted(history)
    by_weekday = {}
    for d, c in history:
        by_weekday.setdefault(d.weekday(), []).append(c)
    recent = mean(c for _, c in history[-14:])
    last_day = history[-1][0]

    days = []
    for i in range(1, days_ahead + 1):
        d = last_day + timedelta(days=i)
        if d.weekday() >= 5:      # offices are open Mon-Fri only
            continue
        same = by_weekday.get(d.weekday(), [])[-4:]
        expected = mean(same) if len(same) >= 2 else recent
        item = {"date": d.isoformat(), "expected": round(expected)}
        if capacity:
            ratio = expected / capacity
            item["status"] = ("over_capacity" if ratio > 1
                              else "near_limit" if ratio >= 0.8 else "ok")
        days.append(item)
    return days