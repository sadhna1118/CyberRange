# CyberRange Attack Scenarios Documentation

## 1. Overview

CyberRange features 7 production-mode attack simulation scenarios formatted in declarative YAML. Each scenario replicates standard adversary tactics, emits corresponding telemetry, and triggers specific Sigma-inspired detection rules that correlate into structured SOC incidents.

---

## 2. Attack Scenarios Catalog

### SCENARIO 1: SSH Brute Force & Password Spraying (`SCENARIO-001`)
- **Tactic**: Credential Access (MITRE T1110)
- **Target**: `lab-linux-01` (SSH port 22)
- **Simulated Flow**: 
  1. Multiple rapid authentication failures with diverse passwords targeting account `root` and `admin`.
  2. One subsequent valid authentication event from the same source IP (`192.168.1.150`).
- **Expected Detections**: `CR-AUTH-001`, `CR-AUTH-002`
- **Expected Risk Score Range**: 75–85 (High)

---

### SCENARIO 2: Web Exploitation (SQL Injection & Path Traversal) (`SCENARIO-002`)
- **Tactic**: Initial Access & Discovery (MITRE T1190, T1083)
- **Target**: `lab-web-01` (HTTP port 8080)
- **Simulated Flow**:
  1. Probing web endpoints with SQL payloads (`' OR 1=1 --`, `UNION SELECT`).
  2. Attempting directory traversal queries (`../../../../etc/passwd`).
  3. Sensitive configuration probing (`/.env`, `/admin/config.php`).
- **Expected Detections**: `CR-WEB-001`, `CR-WEB-003`, `CR-WEB-004`
- **Expected Risk Score Range**: 70–82 (High)

---

### SCENARIO 3: Network Reconnaissance & Port Scanning (`SCENARIO-003`)
- **Tactic**: Reconnaissance & Discovery (MITRE T1595, T1046)
- **Target**: `lab-network-subnet` (`10.0.0.0/24`)
- **Simulated Flow**: Rapid SYN connection sweeps across ports 21, 22, 80, 443, 445, 3306, 8080.
- **Expected Detections**: `CR-NET-001`, `CR-NET-002`
- **Expected Risk Score Range**: 45–60 (Medium)

---

### SCENARIO 4: Linux Privilege Escalation via Sudo Exploitation (`SCENARIO-004`)
- **Tactic**: Privilege Escalation (MITRE T1068, T1548)
- **Target**: `lab-linux-01`
- **Simulated Flow**: Low-privileged user `labuser` executes sudo commands with `NOPASSWD` directives and accesses `/etc/shadow`.
- **Expected Detections**: `CR-PRIV-001`, `CR-PRIV-003`
- **Expected Risk Score Range**: 85–95 (Critical)

---

### SCENARIO 5: Obfuscated Process & Shell Execution (`SCENARIO-005`)
- **Tactic**: Execution & Defense Evasion (MITRE T1059, T1027)
- **Target**: `lab-linux-01`
- **Simulated Flow**: Spawning an interactive `/bin/bash` subshell from web server process `nginx`, executing Base64-encoded command lines.
- **Expected Detections**: `CR-END-001`, `CR-END-002`, `CR-END-003`
- **Expected Risk Score Range**: 80–90 (High)

---

### SCENARIO 6: Data Exfiltration Anomaly (`SCENARIO-006`)
- **Tactic**: Exfiltration (MITRE T1041, T1048)
- **Target**: `lab-linux-01` to external adversary C2 (`45.33.32.156`)
- **Simulated Flow**: High-volume outbound TCP transfer (50+ MB) and high-entropy DNS queries indicative of DNS tunneling.
- **Expected Detections**: `CR-NET-003`, `CR-NET-004`
- **Expected Risk Score Range**: 75–85 (High)

---

### SCENARIO 7: Full Multi-Stage Intrusion Simulation (`SCENARIO-007`)
- **Tactic**: Multi-Stage Kill Chain (Recon $\to$ Initial Access $\to$ Execution $\to$ Privilege Escalation $\to$ Exfiltration)
- **Simulated Flow**:
  1. Port scanning and service discovery on `lab-linux-01`.
  2. SSH password spraying leading to root account compromise.
  3. Interactive shell spawning and encoded payload execution.
  4. Sudo privilege elevation and reading `/etc/shadow`.
  5. Outbound connection establishing C2 channel.
- **Expected Detections**: `CR-AUTH-001`, `CR-AUTH-002`, `CR-END-001`, `CR-PRIV-001`, `CR-NET-003`
- **Correlation**: All 5 alerts automatically correlate into **1 Unified High-Severity Incident**.
- **Expected Risk Score Range**: 90–98 (Critical)
