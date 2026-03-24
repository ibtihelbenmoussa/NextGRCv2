# Database Seeders - Summary

## ✅ Seeded Data Overview

### 1. Organizations (3)

- **ACME Corporation** (ACME) - Technology company
- **Global Finance Group** (GFG) - Financial services
- **TechStart Inc** (TECH) - Digital transformation startup

### 2. Users (10)

All users have password: `password`

| Email                      | Name                 | Department        | Job Title              |
| -------------------------- | -------------------- | ----------------- | ---------------------- |
| admin@example.com          | System Administrator | IT                | System Administrator   |
| chief@acme.com             | Sarah Johnson        | Internal Audit    | Chief Auditor          |
| chief@globalfinance.com    | Michael Chen         | Risk & Compliance | Head of Internal Audit |
| auditor1@acme.com          | Emily Davis          | Internal Audit    | Senior Auditor         |
| auditor2@acme.com          | James Wilson         | Internal Audit    | Auditor                |
| auditor1@globalfinance.com | Lisa Anderson        | Risk & Compliance | IT Auditor             |
| manager.it@acme.com        | Robert Martinez      | IT                | IT Manager             |
| manager.finance@acme.com   | Jennifer Lee         | Finance           | Finance Director       |
| user@acme.com              | David Brown          | Operations        | Operations Manager     |
| test@example.com           | Test User            | Testing           | Test User              |

### 3. User-Organization Assignments

**ACME Corporation:**

- admin@example.com (admin, default)
- chief@acme.com (audit_chief, default)
- auditor1@acme.com (auditor, default)
- auditor2@acme.com (auditor, default)
- manager.it@acme.com (user, default)
- manager.finance@acme.com (user, default)
- user@acme.com (user, default)
- test@example.com (admin, non-default)

**Global Finance Group:**

- admin@example.com (admin, non-default)
- chief@globalfinance.com (audit_chief, default)
- auditor1@globalfinance.com (auditor, default)
- test@example.com (auditor, non-default)

**TechStart Inc:**

- admin@example.com (admin, non-default)
- test@example.com (user, default)

### 4. Organizational Structure

**ACME Corporation:**

- **IT Business Unit**
    - IT Operations (Macro Process)
        - System Monitoring (Process)
        - Backup & Recovery (Process)
    - Cybersecurity (Macro Process)
        - Access Management (Process)
        - Vulnerability Management (Process)
- **Finance & Accounting**
    - Financial Reporting (Macro Process)
        - Month-End Close (Process)
        - Financial Statement Preparation (Process)
    - Accounts Payable (Macro Process)
        - Invoice Processing (Process)
        - Payment Authorization (Process)
- **Operations**
    - Procurement (Macro Process)
        - Purchase Order Management (Process)

**Global Finance Group:**

- **Risk Management**
    - Risk Assessment (Macro Process)
        - Risk Identification (Process)
- **Compliance**
    - Regulatory Compliance (Macro Process)
        - Compliance Monitoring (Process)

### 5. Risks (7)

**ACME Corporation:**

1. RISK-001: Data Breach / Unauthorized Access (Cybersecurity)
2. RISK-002: System Downtime (Operational)
3. RISK-003: Financial Misstatement (Financial)
4. RISK-004: Fraud / Unauthorized Payments (Financial)
5. RISK-005: Data Loss (Operational)

**Global Finance Group:**

1. RISK-GFG-001: Regulatory Non-Compliance (Compliance)
2. RISK-GFG-002: Market Risk (Financial)

### 6. Controls (10)

**ACME Corporation:**

1. CTRL-001: User Access Reviews (Detective/Manual/Quarterly)
2. CTRL-002: Password Policy Enforcement (Preventive/Automated/Continuous)
3. CTRL-003: System Health Monitoring (Detective/Automated/Continuous)
4. CTRL-004: Daily Backups (Preventive/Automated/Daily)
5. CTRL-005: Bank Reconciliation (Detective/Manual/Monthly)
6. CTRL-006: Dual Payment Approval (Preventive/Manual/Per Transaction)
7. CTRL-007: Segregation of Duties (Preventive/Manual/Continuous)
8. CTRL-008: Vulnerability Scanning (Detective/Automated/Weekly)

**Global Finance Group:**

1. CTRL-GFG-001: Compliance Monitoring (Detective/Manual/Monthly)
2. CTRL-GFG-002: Risk Limit Monitoring (Preventive/Automated/Daily)

### 7. Risk-Process-Control Relationships

**Process → Risks:**

- Access Management → Data Breach
- Backup & Recovery → System Downtime, Data Loss
- Month-End Close → Financial Misstatement
- Payment Authorization → Fraud
- Vulnerability Management → Data Breach
- Compliance Monitoring → Regulatory Non-Compliance
- Risk Identification → Market Risk

**Risks → Controls:**

- Data Breach → User Access Reviews, Password Policy, Vulnerability Scanning
- System Downtime → System Monitoring, Daily Backups
- Financial Misstatement → Bank Reconciliation, Segregation of Duties
- Fraud → Dual Payment Approval, Segregation of Duties
- Data Loss → Daily Backups
- Regulatory Non-Compliance → Compliance Monitoring
- Market Risk → Risk Limit Monitoring

### 8. Audit Plans (2)

**ACME 2025 Internal Audit Plan:**

- Code: PLAN-2025
- Period: Jan 1 - Dec 31, 2025

**GFG 2025 Risk & Compliance Plan:**

- Code: GFG-PLAN-2025
- Period: Jan 1 - Dec 31, 2025

### 9. Audit Missions (4)

**ACME Corporation:**

1. **IT General Controls Audit** (AUD-2025-001) - ✅ CLOSED
    - Audit Chief: Sarah Johnson
    - Auditors: Emily Davis, James Wilson
    - Period: Jan 15 - Mar 15, 2025
    - Documents: 2 (all received)
    - Interviews: 1 (conducted)
    - Tests: 3 (all reviewed and accepted)
    - Management Comments: 1
    - Report: Final report issued

2. **Financial Controls Review** (AUD-2025-002) - 🔄 IN PROGRESS
    - Audit Chief: Sarah Johnson
    - Auditors: Emily Davis
    - Period: Apr 1 - Jun 30, 2025
    - Documents: 2 (1 received, 1 pending)
    - Interviews: 1 (scheduled)
    - Tests: 1 (pending review)

3. **Cybersecurity Assessment** (AUD-2025-003) - 📅 PLANNED
    - Audit Chief: Sarah Johnson
    - Period: Jul 1 - Sep 30, 2025

**Global Finance Group:**

1. **Regulatory Compliance Audit** (GFG-AUD-2025-001) - 🔄 IN PROGRESS
    - Audit Chief: Michael Chen
    - Auditors: Lisa Anderson
    - Period: Mar 1 - May 31, 2025

### 10. Test Results Summary

**IT General Controls Audit (ACME):**

- ✅ User Access Review: EFFECTIVE
- ⚠️ Password Policy: PARTIALLY EFFECTIVE (finding: legacy accounts)
- ✅ System Monitoring: EFFECTIVE

**Financial Controls Review (ACME):**

- ✅ Bank Reconciliation: EFFECTIVE (pending review)

## Quick Start

### Run Seeders

```bash
php artisan migrate:fresh --seed
```

### Login Credentials

All users have the password: `password`

**Try these accounts:**

- **Admin (multi-org):** admin@example.com
- **Audit Chief:** chief@acme.com
- **Auditor:** auditor1@acme.com
- **Test User (multi-org):** test@example.com

### Sample Data Highlights

✅ **Complete audit lifecycle examples:**

- Closed audit with full documentation
- In-progress audit with pending items
- Planned future audit

✅ **Real-world scenarios:**

- Control testing with findings
- Management action plans
- Risk-control mappings
- Multi-organization user access

✅ **Rich relationships:**

- Organization → Business Units → Macro Processes → Processes
- Processes → Risks → Controls
- Plannings → Audit Missions → Tests/Documents/Interviews
- Users ↔ Organizations (many-to-many)

This seed data provides a complete, realistic GRC environment for development and testing! 🎉
