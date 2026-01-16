# TCPA Compliance Ruleset Documentation

This document describes each rule in the Whisperwire TCPA compliance ruleset.

> ⚠️ **LEGAL DISCLAIMER**: This documentation provides compliance risk signals only. It is NOT legal advice. Compliance requirements depend on jurisdiction and require legal counsel review. Always consult with qualified legal professionals for compliance decisions.

---

## Rule Categories

| Category | Description | Rule Count |
|----------|-------------|------------|
| Calling Time | Time-of-day restrictions | 1 |
| Do Not Call | DNC list and opt-out handling | 3 |
| Disclosure | Required TSR disclosures | 3 |
| Consent | Consent and revocation | 1 |
| Identification | Caller identification | 1 |
| Prerecorded | Robocall/prerecorded voice | 1 |
| Recording Disclosure | Call recording disclosure | 1 (optional) |

---

## Calling Time Rules

### TIME-001: Calling Time Violation

| Property | Value |
|----------|-------|
| **Severity** | High |
| **Type** | Metadata-based |
| **Optional** | No |

**Description:**
Telemarketing calls made outside 8am-9pm in the consumer's local time zone.

**Why It Matters:**
The TCPA prohibits telemarketing calls before 8am or after 9pm in the consumer's local time zone. Violations can result in $500-$1,500 per call.

**Implementation:**
This rule requires call metadata including the consumer's time zone. The system compares the call timestamp against permitted hours.

**Recommended Response:**
> "Verify time zone before calling. If outside hours, apologize and offer to call back during appropriate hours."

**Legal Reference:**
47 U.S.C. § 227(c)(5); 47 C.F.R. § 64.1200(c)(1)

---

## Do Not Call Rules

### DNC-001: Customer Requested No Further Calls

| Property | Value |
|----------|-------|
| **Severity** | High |
| **Type** | Trigger + Regex |
| **Optional** | No |

**Description:**
Customer explicitly requests to stop receiving calls.

**Trigger Phrases:**
- "don't call me"
- "do not call me"
- "stop calling me"
- "remove me from your list"
- "take me off your list"
- "put me on do not call"
- "no more calls"
- "never call again"
- "stop contacting me"

**Regex Patterns:**
```regex
(?i)(don'?t|do\s*not|stop|quit|cease)\s+(call|contact|ring|phone)
(?i)(remove|take)\s+(me|my\s+number)\s+(from|off)
(?i)(put|add)\s+(me|my\s+number)\s+(on|to)\s+(the\s+)?(do\s*not\s*call|dnc)
```

**Why It Matters:**
Under TCPA, consumers can revoke consent by any reasonable means at any time. Continuing to call after a DNC request is a violation.

**Recommended Response:**
> "Understood—I'll add you to our Do Not Call list effective immediately. You won't receive any more marketing calls from us. Is there anything else I can help you with today?"

**Legal Reference:**
47 U.S.C. § 227(c); 47 C.F.R. § 64.1200(d)

---

### DNC-002: Agent Continued After DNC Request

| Property | Value |
|----------|-------|
| **Severity** | High |
| **Type** | Trigger + Regex |
| **Optional** | No |

**Description:**
Agent attempted to continue sales pitch after customer requested DNC.

**Trigger Phrases:**
- "before you go"
- "just one more thing"
- "let me just tell you"
- "you might want to hear"
- "are you sure"
- "but wait"

**Context Requirement:**
This rule only triggers AFTER a DNC-001 alert has been detected in the same call session.

**Why It Matters:**
After a DNC request, any attempt to continue selling significantly increases violation risk and demonstrates willful non-compliance.

**Recommended Response:**
> "Do not continue selling. Acknowledge the request, confirm DNC placement, and end the call professionally."

**Legal Reference:**
47 C.F.R. § 64.1200(d)(3)

---

### DNC-003: National DNC List - No Consent Evidence

| Property | Value |
|----------|-------|
| **Severity** | High |
| **Type** | Metadata-based |
| **Optional** | No |

**Description:**
Number is on National DNC list and call is marketing without consent evidence.

**Metadata Requirements:**
- `is_dnc_listed: true` (number appears on National DNC Registry)
- `has_prior_consent: false` (no documented consent)

**Why It Matters:**
Calling numbers on the National DNC Registry without prior express consent or an established business relationship is a TCPA violation.

**Recommended Response:**
> "If calling a DNC-listed number, ensure you have documented consent or an existing business relationship. If unsure, end the marketing call."

**Legal Reference:**
47 C.F.R. § 64.1200(c)(2)

---

## Disclosure Rules

### DISC-001: Missing Seller Identity Disclosure

| Property | Value |
|----------|-------|
| **Severity** | Medium |
| **Type** | Negative detection (absence) |
| **Optional** | No |

**Description:**
Agent did not promptly identify the seller/company name.

**Detection Pattern:**
The system looks for phrases indicating identity disclosure:
```regex
(?i)(calling\s+(from|on\s+behalf\s+of)|this\s+is|my\s+name\s+is.*?(with|from))
```

If NOT detected early in the call, a reminder suggestion is generated.

**Why It Matters:**
FTC Telemarketing Sales Rule requires prompt disclosure of the seller's identity at the beginning of outbound sales calls.

**Recommended Response:**
> "Hi, my name is [Name] calling from [Company Name]."

**Legal Reference:**
16 C.F.R. § 310.4(d)(1)

---

### DISC-002: Missing Sales Call Nature Disclosure

| Property | Value |
|----------|-------|
| **Severity** | Medium |
| **Type** | Negative detection (absence) |
| **Optional** | No |

**Description:**
Agent did not disclose that the call is a sales call.

**Detection Pattern:**
```regex
(?i)(sales|marketing|promotion|offer|special\s+deal|opportunity)
```

**Why It Matters:**
The TSR requires disclosure that the call is for sales purposes before making the sales pitch.

**Recommended Response:**
> "I'm calling today with a special offer for you..."

**Legal Reference:**
16 C.F.R. § 310.4(d)(2)

---

### DISC-003: Missing Product/Service Description

| Property | Value |
|----------|-------|
| **Severity** | Low |
| **Type** | Contextual |
| **Optional** | No |

**Description:**
Agent proceeded with pitch without describing what is being sold.

**Why It Matters:**
Consumers should understand what product or service is being offered early in the call.

**Recommended Response:**
> "The reason for my call is to tell you about our [product/service]..."

**Legal Reference:**
16 C.F.R. § 310.4(d)(3)

---

## Consent Rules

### CONS-001: Consent Revocation Detected

| Property | Value |
|----------|-------|
| **Severity** | High |
| **Type** | Trigger + Regex |
| **Optional** | No |

**Description:**
Consumer appears to be revoking consent by reasonable means.

**Trigger Phrases:**
- "i withdraw my consent"
- "i revoke my consent"
- "i take back my consent"
- "i no longer consent"
- "i didn't agree to this"
- "i never agreed"
- "i want to opt out"
- "opt me out"
- "unsubscribe me"

**Regex Patterns:**
```regex
(?i)(withdraw|revoke|take\s+back|cancel)\s+(my\s+)?(consent|permission|authorization)
(?i)(opt|unsubscribe)\s+(me\s+)?out
(?i)(never|didn'?t)\s+(agree|consent|authorize)
```

**Why It Matters:**
Under TCPA, consumers can revoke consent by any reasonable means. Non-standard wording still constitutes valid revocation.

**Recommended Response:**
> "I understand you'd like to revoke your consent. I'll process that right away and you'll be removed from our calling list."

**Legal Reference:**
47 C.F.R. § 64.1200(a)(7)(ii)

---

## Identification Rules

### IDENT-001: Missing Callback Number

| Property | Value |
|----------|-------|
| **Severity** | Low |
| **Type** | Negative detection |
| **Optional** | No |

**Description:**
Agent did not provide callback number/address for consumer contact.

**Detection Pattern:**
```regex
(?i)(call\s+(us\s+)?back\s+at|reach\s+us\s+at|our\s+number\s+is|contact\s+us\s+at)
```

**Why It Matters:**
Telemarketers must provide a means for consumers to reach the business, typically a callback number.

**Recommended Response:**
> "If you have any questions, you can reach us at [phone number]."

**Legal Reference:**
16 C.F.R. § 310.4(d)(7)

---

## Prerecorded Voice Rules

### PREC-001: Prerecorded Voice Without Consent

| Property | Value |
|----------|-------|
| **Severity** | High |
| **Type** | Metadata-based |
| **Optional** | No |

**Description:**
Call using prerecorded/artificial voice without required prior express written consent.

**Metadata Requirements:**
- `is_prerecorded: true` (call uses prerecorded voice)
- `has_prior_consent: false` (no documented written consent)

**Why It Matters:**
TCPA requires prior express written consent for prerecorded telemarketing calls to cell phones.

**Recommended Response:**
> "Ensure written consent is obtained and documented before using prerecorded messages for marketing."

**Legal Reference:**
47 U.S.C. § 227(b)(1)(A)

---

## Recording Disclosure Rules (Optional Module)

### REC-001: Missing Recording Disclosure

| Property | Value |
|----------|-------|
| **Severity** | Medium |
| **Type** | Negative detection |
| **Optional** | Yes ⚠️ |

**Description:**
Call is being recorded without disclosure (jurisdiction-dependent).

**Detection Pattern:**
```regex
(?i)(this\s+call\s+(is|may\s+be)\s+(being\s+)?recorded|call\s+recording|for\s+quality\s+(and\s+training\s+)?purposes)
```

**Important Note:**
This rule is **jurisdiction-dependent**. Recording consent requirements vary significantly by state:

| State Type | Requirement |
|------------|-------------|
| One-party consent | Only caller needs to consent |
| Two-party/all-party consent | All parties must consent |

States with two-party consent include: California, Connecticut, Florida, Illinois, Maryland, Massachusetts, Montana, New Hampshire, Pennsylvania, Washington.

**Why It Matters:**
Some states require two-party consent for call recording. Violating state wiretapping laws can result in civil and criminal penalties.

**Recommended Response:**
> "This call may be recorded for quality and training purposes. By continuing, you consent to this recording."

**Legal Reference:**
State-specific wiretapping/recording consent laws

---

## Adding Custom Rules

To add custom rules, create a new entry in `rules/tcpa-rules.yaml`:

```yaml
- id: CUSTOM-001
  title: Your Custom Rule Title
  category: custom  # Or use existing category
  description: Description of what the rule detects
  severity: high | medium | low
  requires_metadata: false
  triggers:
    - "phrase to detect"
    - "another phrase"
  regex_patterns:
    - "(?i)regex\s+pattern"
  why_it_matters: Explanation for agents
  recommended_fix: What the agent should say
  legal_reference: "Applicable law citation"
  enabled: true
  optional: false
```

After adding rules, restart the application to load the new configuration.

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-16 | Initial release with 11 rules |

---

*Last updated: January 16, 2026*
