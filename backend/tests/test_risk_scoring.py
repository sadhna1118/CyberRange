import pytest
from datetime import datetime, timezone
from backend.app.services.risk_engine import RiskScoringEngine
from backend.app.services.correlation_engine import CorrelationEngine
from backend.app.models.alert import Alert


def test_alert_risk_calculation():
    score = RiskScoringEngine.calculate_alert_risk(
        severity="critical",
        confidence=0.9,
        event_count=5,
        host="lab-linux-01",
        mitre_tactic="Privilege Escalation",
    )
    assert 75 <= score <= 100
    category = RiskScoringEngine.get_risk_category(score)
    assert category in ["high", "critical"]


def test_incident_risk_multi_alert_correlation():
    alerts = [
        {"severity": "high", "confidence": 0.85},
        {"severity": "critical", "confidence": 0.95},
        {"severity": "medium", "confidence": 0.80},
    ]
    assets = ["lab-linux-01", "lab-web-01"]
    tactics = ["Credential Access", "Execution", "Privilege Escalation"]

    incident_score = RiskScoringEngine.calculate_incident_risk(
        alerts=alerts,
        affected_assets=assets,
        mitre_tactics=tactics,
    )
    assert incident_score >= 80
    assert RiskScoringEngine.get_risk_category(incident_score) in ["high", "critical"]
