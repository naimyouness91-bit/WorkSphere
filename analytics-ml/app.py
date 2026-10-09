"""
Optional Python ML microservice for WorkSphere predictive analytics.
Run: pip install flask && python analytics-ml/app.py
Set ANALYTICS_ML_SERVICE_URL=http://127.0.0.1:5050 in backend .env
"""
from flask import Flask, request, jsonify

app = Flask(__name__)


@app.post("/predict")
def predict():
    payload = request.get_json(silent=True) or {}
    departments = payload.get("features", {}).get("departments", [])
    insights = []
    for row in departments:
        if row.get("risk_score", 0) >= 70:
            insights.append({
                "title": f"ML: Elevated risk in {row.get('department', 'Unknown')}",
                "description": f"Model scored department risk at {row.get('risk_score')}% based on performance and attendance.",
                "category": "turnover",
                "confidence_score": min(0.95, row.get("risk_score", 70) / 100),
                "meta": {"source": "ml_service", "department": row.get("department")},
            })
    return jsonify({"insights": insights})


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5050, debug=False)
