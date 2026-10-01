import asyncio
import os
import sys
import random
import uuid
from datetime import datetime, timezone, timedelta

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import select, func
from backend.app.database.database import AsyncSessionLocal, init_db
from backend.app.models import (
    User,
    Event,
    Alert,
    Incident,
    IncidentEvent,
    DetectionRule,
    IOC,
    Evidence,
    InvestigationNote,
    ResponseAction,
    AuditLog,
    SavedHunt,
    ScenarioRun,
)
from backend.app.api.auth import get_password_hash
from backend.app.services.detection_engine import DetectionEngine
from backend.app.services.risk_engine import RiskScoringEngine


async def seed_data(target_events_count: int = 10000):
    print("[INFO] Initializing CyberRange Database Seeder...")
    await init_db()

    async with AsyncSessionLocal() as session:
        # 1. Seed Users
        print("[INFO] Seeding SOC Users...")
        users_data = [
            ("admin", "admin@cyberrange.lab", "CyberRange2026!", "ADMIN", "SOC Administrator"),
            ("lead_analyst", "lead@cyberrange.lab", "Analyst2026!", "SOC_ANALYST", "Lead Analyst (Tier 3)"),
            ("hunter_sarah", "sarah@cyberrange.lab", "Analyst2026!", "SOC_ANALYST", "Threat Hunter Sarah (Tier 2)"),
            ("triage_john", "john@cyberrange.lab", "Analyst2026!", "SOC_ANALYST", "Triage Analyst John (Tier 1)"),
            ("auditor_bob", "auditor@cyberrange.lab", "Viewer2026!", "VIEWER", "Compliance Auditor Bob"),
        ]

        created_users = {}
        for username, email, pw, role, full_name in users_data:
            stmt = select(User).where(User.username == username)
            existing = (await session.execute(stmt)).scalar_one_or_none()
            if not existing:
                u = User(
                    username=username,
                    email=email,
                    hashed_password=get_password_hash(pw),
                    role=role,
                    full_name=full_name,
                    is_active=True,
                )
                session.add(u)
                await session.flush()
                created_users[username] = u
            else:
                created_users[username] = existing

        # 2. Seed Detection Rules into Database
        print("[INFO] Syncing Detection Rules...")
        engine = DetectionEngine()
        engine.load_rules()
        for r_id, r in engine.rules.items():
            stmt = select(DetectionRule).where(DetectionRule.id == r_id)
            existing_rule = (await session.execute(stmt)).scalar_one_or_none()
            mitre = r.get("mitre_attack", {})
            if not existing_rule:
                dr = DetectionRule(
                    id=r_id,
                    name=r.get("name", r_id),
                    category=r.get("category", "generic"),
                    severity=r.get("severity", "medium"),
                    mitre_tactic=mitre.get("tactic", "Discovery"),
                    mitre_technique_id=mitre.get("technique_id", "T1046"),
                    mitre_technique_name=mitre.get("technique_name", ""),
                    description=r.get("description", ""),
                    rule_yaml=str(r),
                    rule_parsed=r,
                    is_enabled=r.get("enabled", True),
                )
                session.add(dr)

        # 3. Seed IOCs
        print("[INFO] Seeding 100+ Indicators of Compromise (IOCs)...")
        now = datetime.now(timezone.utc)
        iocs_seed = []
        for i in range(1, 105):
            if i <= 30:
                ioc_type = "ip"
                val = f"198.51.100.{i + 10}"
                rep = "MALICIOUS" if i % 2 == 0 else "SUSPICIOUS"
                actor = "APT-SIM" if i % 3 == 0 else "BOTNET-PROBER"
            elif i <= 55:
                ioc_type = "domain"
                val = f"staging-c2-node-{i}.xyz"
                rep = "MALICIOUS"
                actor = "C2-INFRA"
            elif i <= 80:
                ioc_type = "hash"
                val = f"{i:04x}" * 16
                rep = "MALICIOUS" if i % 2 == 0 else "SUSPICIOUS"
                actor = "MALWARE-DROPER"
            else:
                ioc_type = "filepath"
                val = f"/tmp/.hidden_exploit_{i}.sh"
                rep = "SUSPICIOUS"
                actor = "LOCAL_EXPLOIT"

            stmt = select(IOC).where(IOC.value == val)
            if not (await session.execute(stmt)).scalar_one_or_none():
                ioc_obj = IOC(
                    ioc_type=ioc_type,
                    value=val,
                    threat_actor=actor,
                    reputation=rep,
                    confidence=0.85,
                    description=f"Synthetic indicator of compromise #{i}",
                    first_seen=now - timedelta(days=random.randint(1, 30)),
                    last_seen=now,
                    source_count=random.randint(1, 50),
                    tags=["synthetic", "lab_ioc"],
                )
                iocs_seed.append(ioc_obj)

        session.add_all(iocs_seed)
        await session.flush()

        # Check existing events count
        current_events_count = (await session.execute(select(func.count(Event.id)))).scalar_one() or 0
        events_to_generate = max(0, target_events_count - current_events_count)

        if events_to_generate > 0:
            print(f"[INFO] Generating {events_to_generate} Synthetic Baseline & Threat Events in chunks...")
            hosts = ["lab-linux-01", "lab-web-01", "lab-db-01", "lab-worker-01", "workstation-01"]
            sources = ["linux-auth", "nginx", "auditd", "zeek", "sysmon"]
            users = ["admin", "root", "devuser", "www-data", "deploy", "guest", "ubuntu"]
            ips_benign = ["10.10.10.1", "10.10.10.2", "10.10.10.15", "192.168.1.100", "192.168.1.105"]
            ips_threat = ["10.10.10.50", "185.220.101.5", "198.51.100.42", "203.0.113.19"]

            chunk_size = 1000
            for chunk_idx in range(0, events_to_generate, chunk_size):
                chunk_events = []
                batch_count = min(chunk_size, events_to_generate - chunk_idx)

                for _ in range(batch_count):
                    is_threat = random.random() < 0.15
                    ts = now - timedelta(hours=random.randint(0, 72), minutes=random.randint(0, 59), seconds=random.randint(0, 59))
                    host = random.choice(hosts)
                    src_ip = random.choice(ips_threat) if is_threat else random.choice(ips_benign)
                    u = random.choice(users)

                    dice = random.randint(1, 5)
                    if dice == 1:
                        # Auth
                        act = "login_failed" if is_threat else random.choice(["login_failed", "login_success"])
                        sev = "medium" if act == "login_failed" else "low"
                        msg = f"Authentication {act} for user {u} from {src_ip} port {random.randint(1024, 65535)}"
                        ev = Event(
                            timestamp=ts,
                            source="linux-auth",
                            host=host,
                            event_type="authentication",
                            action=act,
                            user=u,
                            source_ip=src_ip,
                            severity=sev,
                            raw_message=msg,
                            metadata_payload={"port": random.randint(1024, 65535)},
                            is_synthetic=True,
                        )
                    elif dice == 2:
                        # Web
                        if is_threat:
                            url = random.choice(["/.env", "/wp-login.php", "/api/users?id=1 UNION SELECT 1,2--", "/view?file=../../../../etc/passwd"])
                            status_code = random.choice([200, 403, 404, 500])
                            sev = "high" if "UNION" in url or "etc/passwd" in url else "medium"
                        else:
                            url = random.choice(["/", "/dashboard", "/api/v1/health", "/static/app.js", "/login"])
                            status_code = 200
                            sev = "low"
                        msg = f'{src_ip} - - [{ts.strftime("%d/%b/%Y:%H:%M:%S +0000")}] "GET {url} HTTP/1.1" {status_code} {random.randint(200, 10000)}'
                        ev = Event(
                            timestamp=ts,
                            source="nginx",
                            host="lab-web-01",
                            event_type="web",
                            action="http_request",
                            source_ip=src_ip,
                            severity=sev,
                            raw_message=msg,
                            metadata_payload={"url": url, "method": "GET", "status_code": status_code},
                            is_synthetic=True,
                        )
                    elif dice == 3:
                        # Process / Endpoint
                        proc = random.choice(["/bin/bash -i", "echo c2hhZG93 | base64 -d | sh", "mimikatz", "vssadmin delete shadows"]) if is_threat else random.choice(["systemctl status nginx", "grep -r log /var/log", "python app.py", "git status"])
                        sev = "critical" if "mimikatz" in proc or "bash -i" in proc else ("high" if is_threat else "low")
                        msg = f"Process execution: '{proc}' by user {u} on {host}"
                        ev = Event(
                            timestamp=ts,
                            source="sysmon",
                            host=host,
                            event_type="endpoint",
                            action="process_create",
                            user=u,
                            process=proc,
                            severity=sev,
                            raw_message=msg,
                            metadata_payload={"pid": random.randint(1000, 65000), "parent_process": "sshd" if is_threat else "bash"},
                            is_synthetic=True,
                        )
                    elif dice == 4:
                        # Network
                        act = "connection_attempt" if is_threat else "connection_established"
                        dst_port = random.choice([21, 22, 80, 443, 3306, 8080])
                        sev = "medium" if is_threat else "info"
                        msg = f"Zeek flow {act} from {src_ip} to {host}:{dst_port} proto tcp"
                        ev = Event(
                            timestamp=ts,
                            source="zeek",
                            host=host,
                            event_type="network",
                            action=act,
                            source_ip=src_ip,
                            severity=sev,
                            raw_message=msg,
                            metadata_payload={"dst_port": dst_port, "proto": "tcp"},
                            is_synthetic=True,
                        )
                    else:
                        # Privilege
                        act = "sudo_command"
                        proc = "sudo su - root" if is_threat else "sudo systemctl restart nginx"
                        sev = "high" if is_threat else "low"
                        msg = f"{u} : TTY=pts/0 ; PWD=/home/{u} ; USER=root ; COMMAND={proc}"
                        ev = Event(
                            timestamp=ts,
                            source="auditd",
                            host=host,
                            event_type="privilege",
                            action=act,
                            user=u,
                            process=proc,
                            severity=sev,
                            raw_message=msg,
                            metadata_payload={"target_user": "root"},
                            is_synthetic=True,
                        )

                    chunk_events.append(ev)

                session.add_all(chunk_events)
                await session.flush()
                print(f"  -> Ingested {chunk_idx + len(chunk_events)} / {events_to_generate} events...")

        # 4. Seed 500+ Alerts & 50+ Correlated Incidents
        print("[INFO] Seeding 500+ Alerts and 50+ Incidents...")
        current_alerts = (await session.execute(select(func.count(Alert.id)))).scalar_one() or 0
        if current_alerts < 500:
            rules_catalog = list(engine.rules.values())
            incidents_to_create = 52

            for inc_idx in range(1, incidents_to_create + 1):
                rule_sample = random.sample(rules_catalog, k=random.randint(4, 9))
                host = random.choice(["lab-linux-01", "lab-web-01", "lab-db-01"])
                src_ip = random.choice(["10.10.10.50", "185.220.101.5", "198.51.100.42", "203.0.113.19"])
                user = random.choice(["root", "admin", "devuser", "www-data"])
                inc_ts = now - timedelta(days=random.randint(0, 14), hours=random.randint(0, 23))

                inc_status = random.choice(["OPEN", "INVESTIGATING", "CONTAINED", "CLOSED"])
                inc_risk = random.randint(45, 96)
                inc_sev = RiskScoringEngine.get_risk_category(inc_risk)

                primary_mitre = rule_sample[0].get("mitre_attack", {})
                tactic_name = primary_mitre.get("tactic", "Discovery")

                incident = Incident(
                    title=f"{tactic_name} Intrusion Activity on {host} (#{inc_idx})",
                    description=f"Automated correlation detected multi-stage threat indicators originating from {src_ip} against user account '{user}'.",
                    severity=inc_sev,
                    risk_score=inc_risk,
                    status=inc_status,
                    correlation_id=f"CORR-IP-{src_ip}-HOST-{host}",
                    affected_assets=[host],
                    indicators=[src_ip, user],
                    mitre_techniques=[
                        {"tactic": r.get("mitre_attack", {}).get("tactic", "Discovery"),
                         "technique_id": r.get("mitre_attack", {}).get("technique_id", "T1046"),
                         "technique_name": r.get("mitre_attack", {}).get("technique_name", "")}
                        for r in rule_sample
                    ],
                    containment_status="CONTAINED" if inc_status in ["CONTAINED", "CLOSED"] else "NOT_CONTAINED",
                    resolution_summary="Incident investigated, IOCs isolated, and mitigation confirmed." if inc_status == "CLOSED" else None,
                    created_at=inc_ts,
                    updated_at=inc_ts + timedelta(minutes=random.randint(15, 120)),
                )
                session.add(incident)
                await session.flush()

                # Add alerts to this incident
                for r in rule_sample:
                    mitre = r.get("mitre_attack", {})
                    alert_ts = inc_ts + timedelta(minutes=random.randint(0, 20))
                    al = Alert(
                        rule_id=r.get("id"),
                        incident_id=incident.id,
                        title=r.get("name", r.get("id")),
                        description=r.get("description", ""),
                        severity=r.get("severity", "medium"),
                        confidence=float(r.get("confidence", 0.85)),
                        source="detection-engine",
                        mitre_tactic=mitre.get("tactic", "Discovery"),
                        mitre_technique_id=mitre.get("technique_id", "T1046"),
                        mitre_technique_name=mitre.get("technique_name", ""),
                        first_seen=alert_ts,
                        last_seen=alert_ts + timedelta(minutes=2),
                        event_count=random.randint(1, 12),
                        status="ACKNOWLEDGED" if inc_status != "OPEN" else "NEW",
                        affected_hosts=[host],
                        source_ips=[src_ip],
                        target_users=[user],
                        sample_events=[{"raw_message": f"Simulated detection trigger for {r.get('id')}"}],
                        created_at=alert_ts,
                    )
                    session.add(al)

                # Add sample evidence & note for each incident
                ev = Evidence(
                    incident_id=incident.id,
                    evidence_type="log",
                    description=f"Auth log capture for adversary IP {src_ip}",
                    sha256_hash=f"{inc_idx:04x}a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef",
                    collected_by="lead_analyst",
                )
                session.add(ev)

                note = InvestigationNote(
                    incident_id=incident.id,
                    author_username="lead_analyst",
                    note_text=f"Initial triage completed. Confirmed adversary IP {src_ip} attempted technique {primary_mitre.get('technique_id', 'T1110')}.",
                    created_at=inc_ts + timedelta(minutes=10),
                )
                session.add(note)

                act = ResponseAction(
                    incident_id=incident.id,
                    action_type="block_ip",
                    target_identifier=src_ip,
                    description=f"Automated firewall block rule applied for {src_ip}",
                    status="SUCCESS",
                    executed_by="lead_analyst",
                    result_summary=f"Firewall drop rule applied across perimeter interfaces.",
                    executed_at=inc_ts + timedelta(minutes=25),
                )
                session.add(act)

            await session.flush()

        # 5. Seed Saved Threat Hunts
        print("[INFO] Seeding Saved Threat Hunts...")
        saved_hunts_data = [
            ("Failed SSH Logins Spike", "Searches for high volume authentication failures across all Linux targets.", {"event_type": "authentication", "action": "login_failed", "severity": "medium"}, ["auth", "brute_force"]),
            ("Interactive Web Shells", "Hunts for web servers spawning /bin/sh or bash processes.", {"event_type": "endpoint", "process": "bash", "user": "www-data"}, ["webshell", "persistence"]),
            ("Sensitive File Harvesting", "Identifies read attempts on /etc/shadow and SAM databases.", {"event_type": "file", "keyword": "shadow"}, ["credentials", "privesc"]),
            ("Outbound Data Exfiltration Spike", "Filters network telemetry for connections over 5MB payload size.", {"event_type": "network", "action": "outbound_flow"}, ["exfil", "network"]),
        ]

        for title, desc_text, dsl, tags in saved_hunts_data:
            stmt = select(SavedHunt).where(SavedHunt.title == title)
            if not (await session.execute(stmt)).scalar_one_or_none():
                sh = SavedHunt(
                    title=title,
                    description=desc_text,
                    query_dsl=dsl,
                    created_by="hunter_sarah",
                    tags=tags,
                    match_count=random.randint(12, 140),
                )
                session.add(sh)

        await session.commit()
        print("[SUCCESS] Database Seeding Completed Successfully!")


if __name__ == "__main__":
    asyncio.run(seed_data(10000))
