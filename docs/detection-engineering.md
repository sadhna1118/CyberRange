# CyberRange Detection Engineering Guide

## 1. Detection Engineering Philosophy

Detection Engineering in **CyberRange** follows the Sigma standard of declarative, behavioral, and vendor-agnostic detection rules. Rather than relying solely on static IOC indicators (such as specific IP addresses or file hashes that adversaries easily rotate), CyberRange rules detect adversary **Tactics, Techniques, and Procedures (TTPs)** as codified in the MITRE ATT&CK® Enterprise Framework.

---

## 2. Rule Structure & Syntax

All CyberRange detection rules are defined in YAML under `detection-rules/`:

```yaml
name: Multiple Failed SSH Login Attempts
id: CR-AUTH-001
severity: high
category: authentication
enabled: true

condition:
  event_type: authentication
  action: login_failed

threshold:
  count: 5
  window_minutes: 5

group_by:
  - source_ip
  - user

mitre_attack:
  tactic: Credential Access
  technique: T1110
  technique_name: Brute Force

description: Detects repeated authentication failures from a single source targeting one or more user accounts within a 5-minute sliding window.
```

---

## 3. Implemented Detection Rules Catalog (21 Rules)

| Rule ID | Category | Name | MITRE ID | Tactic | Severity |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **CR-AUTH-001** | Authentication | Multiple Failed Logins (Brute Force) | T1110 | Credential Access | High |
| **CR-AUTH-002** | Authentication | Successful Login After Repeated Failures | T1110.001 | Credential Access | Critical |
| **CR-AUTH-003** | Authentication | Login from Unusual / External IP | T1078 | Initial Access | Medium |
| **CR-AUTH-004** | Authentication | Password Spraying (Multiple Accounts Target) | T1110.003 | Credential Access | High |
| **CR-WEB-001** | Web | SQL Injection Pattern in HTTP Query/Body | T1190 | Initial Access | High |
| **CR-WEB-002** | Web | Cross-Site Scripting (XSS) Indicator | T1190 | Initial Access | Medium |
| **CR-WEB-003** | Web | Path Traversal / Directory Probing | T1190 | Initial Access | High |
| **CR-WEB-004** | Web | Sensitive Endpoint Probing (.env, /admin) | T1083 | Discovery | Medium |
| **CR-WEB-005** | Web | High-Volume HTTP Error Anomaly (Scanning) | T1595 | Reconnaissance | Medium |
| **CR-END-001** | Endpoint | Suspicious Shell Execution (bash/sh from web) | T1059.004 | Execution | Critical |
| **CR-END-002** | Endpoint | Encoded Command Execution (Base64/PowerShell) | T1027 | Defense Evasion | High |
| **CR-END-003** | Endpoint | Unexpected Interactive Shell from System Daemon | T1059 | Execution | High |
| **CR-END-004** | Endpoint | Suspicious Process Tree (Spawning subshell) | T1057 | Discovery | Medium |
| **CR-NET-001** | Network | Port Scanning Pattern (Rapid Port Probes) | T1595.001 | Reconnaissance | Medium |
| **CR-NET-002** | Network | Repeated Outbound Connection Failures | T1046 | Discovery | Low |
| **CR-NET-003** | Network | Abnormal Outbound Data Volume (Exfil Indicator) | T1041 | Exfiltration | High |
| **CR-NET-004** | Network | Suspicious DNS Tunneling / Subdomain Entropy | T1048.003 | Exfiltration | High |
| **CR-PRIV-001** | Privilege | Sudo Privilege Escalation Anomaly | T1068 | Privilege Escalation | Critical |
| **CR-PRIV-002** | Privilege | Unexpected Administrative Command Execution | T1548.003 | Privilege Escalation | High |
| **CR-PRIV-003** | Privilege | Sensitive File Access (/etc/shadow, SAM) | T1003.008 | Credential Access | Critical |
| **CR-PRIV-004** | Privilege | Unauthorized Local Account Creation | T1078.003 | Persistence | High |

---

## 4. Rule Validation & Testing Methodology

Every detection rule in CyberRange is validated through three distinct unit test cases in `backend/tests/test_detection_engine.py`:

1. **Positive Test Case**: Validates that telemetry exhibiting malicious behavior triggers the alert as expected with correct MITRE tags and risk weighting.
2. **Negative Test Case**: Validates that standard baseline administrative or normal user activity below thresholds does not trigger false positives.
3. **Edge Case / Threshold Boundary Test**: Validates sliding-window boundary conditions, distinct account grouping, and cooldown suppression logic.
