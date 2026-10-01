import pytest
from datetime import datetime
from backend.app.services.normalizer import LogNormalizer


def test_ssh_failed_login_normalization():
    raw_log = {
        "raw_message": "Failed password for invalid user admin from 10.10.10.50 port 45892 ssh2",
        "source": "linux-auth",
        "host": "lab-linux-01",
    }
    normalized = LogNormalizer.normalize(raw_log)

    assert normalized["event_type"] == "authentication"
    assert normalized["action"] == "login_failed"
    assert normalized["user"] == "admin"
    assert normalized["source_ip"] == "10.10.10.50"
    assert normalized["host"] == "lab-linux-01"
    assert normalized["severity"] == "medium"
    assert normalized["metadata_payload"]["port"] == 45892


def test_nginx_access_log_normalization():
    raw_log = {
        "raw_message": '198.51.100.42 - - [29/Sep/2026:10:00:05 +0000] "GET /api/users?id=1 HTTP/1.1" 200 4096',
        "source": "nginx",
        "host": "lab-web-01",
    }
    normalized = LogNormalizer.normalize(raw_log)

    assert normalized["event_type"] == "web"
    assert normalized["action"] == "http_request"
    assert normalized["source_ip"] == "198.51.100.42"
    assert normalized["metadata_payload"]["method"] == "GET"
    assert normalized["metadata_payload"]["url"] == "/api/users?id=1"
    assert normalized["metadata_payload"]["status_code"] == 200


def test_ioc_candidate_extraction():
    text = (
        "Adversary connected from 10.10.10.50 and downloaded payload from "
        "http://evil-c2-lab.xyz/shell.sh with hash e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    )
    iocs = LogNormalizer.extract_iocs(text)
    ioc_types = {i["type"]: i["value"] for i in iocs}

    assert "ip" in ioc_types
    assert ioc_types["ip"] == "10.10.10.50"
    assert "url" in ioc_types
    assert ioc_types["url"] == "http://evil-c2-lab.xyz/shell.sh"
    assert "hash" in ioc_types
    assert ioc_types["hash"] == "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
