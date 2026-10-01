# CyberRange Architecture & Technical Design

## 1. Executive Summary

**CyberRange** is an enterprise-grade Attack Detection & Investigation Lab platform built for Blue Teams, SOC Analysts, and Detection Engineers. It bridges the gap between offensive attack simulations and defensive security operations by providing a realistic, closed-loop pipeline for telemetry generation, log normalization, rule-based detection, incident correlation, risk scoring, evidence management, and threat hunting.

---

## 2. End-to-End System Flow

```mermaid
flowchart TD
    subgraph ATTACK_SIMULATION["1. Safe Simulation Engine"]
        SIM["Scenario Runner (Localhost Lab)"]
        SSH_BF["SSH Brute Force"]
        WEB_SQLI["Web Attack (SQLi/XSS)"]
        SHELL_EXEC["Suspicious Process"]
        PRIV_ESC["Privilege Escalation"]
    end

    subgraph TELEMETRY_INGESTION["2. Telemetry Ingestion & Normalization"]
        EMITTER["Log Generator / Collectors"]
        NORM["Normalizer (Regex, Timestamps, Taxonomy)"]
        IOC_EXT["IOC Extraction Engine"]
    end

    subgraph DETECTION_ENGINE["3. Real-Time Detection Engine"]
        RULES["21 Sigma-Inspired YAML Rules"]
        THRESH["Sliding Window Aggregator"]
        SUPPR["Suppression & Cooldown Cache"]
    end

    subgraph CORRELATION_RISK["4. Alert Correlation & Risk Engine"]
        CORR["Temporal & Entity Correlator"]
        RISK["Multi-Factor 0-100 Risk Scorer"]
        INCIDENT["Incident Entity Generator"]
    end

    subgraph SOC_OPERATIONS["5. SOC Operations & Workbench"]
        DASH["Live SOC Dashboard"]
        WORKBENCH["Investigation Workbench & Timeline"]
        PLAYBOOK["Containment Playbooks"]
        TRAIN["Blue Team Training Evaluator"]
        REPORT["Executive Post-Mortem Generator"]
    end

    SIM --> SSH_BF & WEB_SQLI & SHELL_EXEC & PRIV_ESC
    SSH_BF & WEB_SQLI & SHELL_EXEC & PRIV_ESC --> EMITTER
    EMITTER --> NORM
    NORM --> IOC_EXT
    NORM --> RULES
    RULES --> THRESH --> SUPPR
    SUPPR --> CORR
    CORR --> RISK --> INCIDENT
    INCIDENT --> DASH & WORKBENCH & PLAYBOOK & TRAIN & REPORT
```

---

## 3. Component Architecture

### 3.1 Backend Architecture (FastAPI & Async SQLAlchemy)
- **API Gateway**: RESTful endpoints and WebSocket server running on `FastAPI` with Pydantic v2 validation.
- **Normalization Layer** (`backend/app/services/normalizer.py`): Parses diverse log sources (Linux SSH, Nginx access logs, Auditd privilege executions, Sysmon process trees, Zeek connection flows) into a unified `SecurityEvent` schema.
- **Detection Engine** (`backend/app/services/detection_engine.py`): Evaluates behavioral YAML rules, sliding-window thresholds, regex/contains filters, and distinct count conditions.
- **Correlation Engine** (`backend/app/services/correlation_engine.py`): Clusters isolated alerts that share affected hosts, threat actor source IPs, targeted accounts, and temporal proximity into cohesive `Incident` records.
- **Risk Scoring Engine** (`backend/app/services/risk_engine.py`): Computes transparent 0–100 risk scores combining alert severity weights, confidence levels, event frequency, asset criticality, and MITRE kill chain impact.
- **Threat Intel Interface** (`backend/app/services/threat_intel.py`): Pluggable reputation resolver with local JSON dataset support and extensible third-party provider interfaces (VirusTotal, AbuseIPDB, AlienVault OTX).
- **Evidence Management** (`backend/app/services/evidence_service.py`): Computes SHA-256 cryptographic hashes for uploaded artifacts to ensure legal chain-of-custody integrity.
- **Blue Team Training Engine** (`backend/app/services/training_service.py`): Evaluates blind analyst incident responses against ground truth benchmarks and calculates objective Training Scores (0–100).

---

### 3.2 Database Schema & ER Model

```mermaid
erDiagram
    USERS ||--o{ AUDIT_LOGS : performs
    EVENTS ||--o{ ALERTS : triggers
    ALERTS }o--|| INCIDENTS : correlated_into
    INCIDENTS ||--o{ INCIDENT_EVENTS : links
    INCIDENTS ||--o{ EVIDENCE : contains
    INCIDENTS ||--o{ INVESTIGATION_NOTES : annotated_by
    INCIDENTS ||--o{ RESPONSE_ACTIONS : remediated_by
    INCIDENTS ||--o{ REPORTS : documented_in
    DETECTION_RULES ||--o{ ALERTS : defines
    ATTACK_SCENARIOS ||--o{ SCENARIO_RUNS : executes

    USERS {
        uuid id PK
        string username UK
        string email UK
        string hashed_password
        string role
        boolean is_active
        datetime created_at
    }

    EVENTS {
        uuid id PK
        datetime timestamp
        string source
        string host
        string event_type
        string action
        string user
        string source_ip
        string destination_ip
        string process
        string severity
        text raw_message
        json metadata_payload
        boolean is_synthetic
    }

    ALERTS {
        uuid id PK
        string rule_id FK
        uuid incident_id FK
        string title
        string severity
        float confidence
        string mitre_tactic
        string mitre_technique_id
        integer event_count
        string status
        json affected_hosts
        json source_ips
        json target_users
        datetime first_seen
        datetime last_seen
    }

    INCIDENTS {
        uuid id PK
        string title
        string severity
        integer risk_score
        string status
        string correlation_id
        json affected_assets
        json mitre_techniques
        json indicators
        string containment_status
        datetime created_at
    }
```

---

### 3.3 Frontend Architecture (React 18 + TypeScript + Vite + Tailwind CSS)
- **Single Page Architecture**: Modular page components for Dashboard, Events, Alerts, Incidents, Investigation Workbench, Threat Hunting DSL, Detection Rules, MITRE ATT&CK Matrix, Attack Simulation Lab, Blue Team Training, IOC Vault, Reports, and System Health.
- **Cyberpunk Dark Theme**: Tailored glassmorphism UI tokens, radar sweep animations, risk score dials, and glowing severity indicators.
- **Real-Time WebSockets**: Instant toast banner alerts broadcasted from the backend event loop to analyst sessions without manual polling.
