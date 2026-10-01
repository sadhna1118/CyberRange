import pytest
from datetime import datetime, timezone
from backend.app.services.detection_engine import DetectionEngine


@pytest.fixture
def engine():
    eng = DetectionEngine(rules_dir="./detection-rules")
    eng.load_rules()
    return eng


def test_cr_auth_001_positive_alert(engine):
    """Positive test: 5 failed logins within 5 minutes MUST trigger CR-AUTH-001."""
    now = datetime.now(timezone.utc)
    alerts = []
    for i in range(5):
        ev = {
            "timestamp": now,
            "source": "linux-auth",
            "host": "lab-linux-01",
            "event_type": "authentication",
            "action": "login_failed",
            "user": "root",
            "source_ip": "10.10.10.50",
            "raw_message": f"Failed password for root from 10.10.10.50 port {40000+i}",
        }
        res = engine.evaluate_event(ev)
        alerts.extend(res)

    rule_alerts = [a for a in alerts if a["rule_id"] == "CR-AUTH-001"]
    assert len(rule_alerts) >= 1
    assert rule_alerts[0]["severity"] == "high"
    assert rule_alerts[0]["mitre_technique_id"] == "T1110"


def test_cr_auth_001_negative_no_alert(engine):
    """Negative test: 2 failed logins MUST NOT trigger CR-AUTH-001."""
    engine.state_buffer.clear()
    engine.suppression_tracker.clear()
    now = datetime.now(timezone.utc)
    alerts = []
    for i in range(2):
        ev = {
            "timestamp": now,
            "source": "linux-auth",
            "host": "lab-linux-01",
            "event_type": "authentication",
            "action": "login_failed",
            "user": "benign_user",
            "source_ip": "192.168.1.10",
            "raw_message": f"Failed password for benign_user from 192.168.1.10 port {40000+i}",
        }
        res = engine.evaluate_event(ev)
        alerts.extend(res)

    rule_alerts = [a for a in alerts if a["rule_id"] == "CR-AUTH-001"]
    assert len(rule_alerts) == 0


def test_cr_web_001_sql_injection_detection(engine):
    """Positive test: SQL injection pattern in web request triggers CR-WEB-001."""
    ev = {
        "timestamp": datetime.now(timezone.utc),
        "source": "nginx",
        "host": "lab-web-01",
        "event_type": "web",
        "action": "http_request",
        "source_ip": "198.51.100.42",
        "raw_message": '198.51.100.42 - - "GET /api/users?id=1 UNION SELECT username,password FROM users-- HTTP/1.1" 200 4096',
        "metadata_payload": {"url": "/api/users?id=1 UNION SELECT username,password FROM users--"},
    }
    alerts = engine.evaluate_event(ev)
    rule_alerts = [a for a in alerts if a["rule_id"] == "CR-WEB-001"]
    assert len(rule_alerts) == 1
    assert rule_alerts[0]["mitre_technique_id"] == "T1190"


def test_cr_priv_003_shadow_file_access(engine):
    """Positive test: /etc/shadow access triggers CR-PRIV-003 OS Credential Dumping."""
    ev = {
        "timestamp": datetime.now(timezone.utc),
        "source": "auditd",
        "host": "lab-linux-01",
        "event_type": "file",
        "action": "file_access",
        "user": "devuser",
        "process": "cat /etc/shadow",
        "raw_message": "File read on /etc/shadow by process cat user devuser",
        "metadata_payload": {"target_file": "/etc/shadow"},
    }
    alerts = engine.evaluate_event(ev)
    rule_alerts = [a for a in alerts if a["rule_id"] == "CR-PRIV-003"]
    assert len(rule_alerts) == 1
    assert rule_alerts[0]["mitre_technique_id"] == "T1003"
