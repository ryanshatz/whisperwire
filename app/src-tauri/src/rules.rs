use serde::{Deserialize, Serialize};

/// Rule category for grouping and filtering
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum RuleCategory {
    CallingTime,
    DoNotCall,
    Disclosure,
    Consent,
    Identification,
    RecordingDisclosure,
    Prerecorded,
}

/// Severity level for alerts
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum Severity {
    Low,
    Medium,
    High,
}

/// A single compliance rule
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Rule {
    pub id: String,
    pub title: String,
    pub category: RuleCategory,
    pub description: String,
    pub severity: Severity,
    pub triggers: Vec<String>,
    pub regex_patterns: Vec<String>,
    pub requires_metadata: bool,
    pub metadata_field: Option<String>,
    pub why_it_matters: String,
    pub recommended_fix: String,
    pub legal_reference: String,
    pub enabled: bool,
    pub optional: bool,
}

/// Complete ruleset with metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RuleSet {
    pub version: String,
    pub last_updated: String,
    pub disclaimer: String,
    pub rules: Vec<Rule>,
}

impl RuleSet {
    /// Load the default embedded ruleset
    pub fn load_default() -> Result<Self, String> {
        Ok(RuleSet {
            version: "1.0.0".to_string(),
            last_updated: "2026-01-16".to_string(),
            disclaimer: "This tool provides compliance risk signals only. It is NOT legal advice. \
                         Compliance requirements depend on jurisdiction and require legal counsel review. \
                         Always consult with qualified legal professionals for compliance decisions.".to_string(),
            rules: Self::get_default_rules(),
        })
    }
    
    fn get_default_rules() -> Vec<Rule> {
        vec![
            // Calling Time Rules
            Rule {
                id: "TIME-001".to_string(),
                title: "Calling Time Violation".to_string(),
                category: RuleCategory::CallingTime,
                description: "Telemarketing calls made outside 8am-9pm in the consumer's local time".to_string(),
                severity: Severity::High,
                triggers: vec![],
                regex_patterns: vec![],
                requires_metadata: true,
                metadata_field: Some("call_time_local".to_string()),
                why_it_matters: "The TCPA prohibits telemarketing calls before 8am or after 9pm in the \
                                 consumer's local time zone. Violations can result in $500-$1,500 per call.".to_string(),
                recommended_fix: "Verify time zone before calling. If outside hours, apologize and offer \
                                  to call back during appropriate hours.".to_string(),
                legal_reference: "47 U.S.C. § 227(c)(5); 47 C.F.R. § 64.1200(c)(1)".to_string(),
                enabled: true,
                optional: false,
            },
            
            // Do Not Call Rules
            Rule {
                id: "DNC-001".to_string(),
                title: "Customer Requested No Further Calls".to_string(),
                category: RuleCategory::DoNotCall,
                description: "Customer explicitly requests to stop receiving calls".to_string(),
                severity: Severity::High,
                triggers: vec![
                    "don't call me".to_string(),
                    "do not call me".to_string(),
                    "stop calling me".to_string(),
                    "remove me from your list".to_string(),
                    "take me off your list".to_string(),
                    "put me on do not call".to_string(),
                    "add me to do not call".to_string(),
                    "no more calls".to_string(),
                    "never call again".to_string(),
                    "stop contacting me".to_string(),
                ],
                regex_patterns: vec![
                    r"(?i)(don'?t|do\s*not|stop|quit|cease)\s+(call|contact|ring|phone)".to_string(),
                    r"(?i)(remove|take)\s+(me|my\s+number)\s+(from|off)".to_string(),
                    r"(?i)(put|add)\s+(me|my\s+number)\s+(on|to)\s+(the\s+)?(do\s*not\s*call|dnc)".to_string(),
                ],
                requires_metadata: false,
                metadata_field: None,
                why_it_matters: "Under TCPA, consumers can revoke consent by any reasonable means at any time. \
                                 Continuing to call after a DNC request is a violation.".to_string(),
                recommended_fix: "Understood—I'll add you to our Do Not Call list effective immediately. \
                                  You won't receive any more marketing calls from us. Is there anything else \
                                  I can help you with today?".to_string(),
                legal_reference: "47 U.S.C. § 227(c); 47 C.F.R. § 64.1200(d)".to_string(),
                enabled: true,
                optional: false,
            },
            Rule {
                id: "DNC-002".to_string(),
                title: "Agent Continued After DNC Request".to_string(),
                category: RuleCategory::DoNotCall,
                description: "Agent attempted to continue sales pitch after customer requested DNC".to_string(),
                severity: Severity::High,
                triggers: vec![
                    "before you go".to_string(),
                    "just one more thing".to_string(),
                    "let me just tell you".to_string(),
                    "you might want to hear".to_string(),
                    "are you sure".to_string(),
                    "but wait".to_string(),
                ],
                regex_patterns: vec![
                    r"(?i)(before\s+you\s+go|just\s+one\s+more|let\s+me\s+just)".to_string(),
                    r"(?i)(are\s+you\s+sure|but\s+wait|hear\s+me\s+out)".to_string(),
                ],
                requires_metadata: false,
                metadata_field: None,
                why_it_matters: "After a DNC request, any attempt to continue selling significantly \
                                 increases violation risk and demonstrates willful non-compliance.".to_string(),
                recommended_fix: "Do not continue selling. Acknowledge the request, confirm DNC placement, \
                                  and end the call professionally.".to_string(),
                legal_reference: "47 C.F.R. § 64.1200(d)(3)".to_string(),
                enabled: true,
                optional: false,
            },
            Rule {
                id: "DNC-003".to_string(),
                title: "National DNC List - No Consent Evidence".to_string(),
                category: RuleCategory::DoNotCall,
                description: "Number is on National DNC list and call is marketing without consent evidence".to_string(),
                severity: Severity::High,
                triggers: vec![],
                regex_patterns: vec![],
                requires_metadata: true,
                metadata_field: Some("is_dnc_listed".to_string()),
                why_it_matters: "Calling numbers on the National DNC Registry without prior express consent \
                                 or an established business relationship is a TCPA violation.".to_string(),
                recommended_fix: "If calling a DNC-listed number, ensure you have documented consent or \
                                  an existing business relationship. If unsure, end the marketing call.".to_string(),
                legal_reference: "47 C.F.R. § 64.1200(c)(2)".to_string(),
                enabled: true,
                optional: false,
            },
            
            // Disclosure Rules
            Rule {
                id: "DISC-001".to_string(),
                title: "Missing Seller Identity Disclosure".to_string(),
                category: RuleCategory::Disclosure,
                description: "Agent did not promptly identify the seller/company name".to_string(),
                severity: Severity::Medium,
                triggers: vec![],
                regex_patterns: vec![
                    r"(?i)(calling\s+(from|on\s+behalf\s+of)|this\s+is|my\s+name\s+is.*?(with|from))".to_string(),
                ],
                requires_metadata: false,
                metadata_field: None,
                why_it_matters: "FTC Telemarketing Sales Rule requires prompt disclosure of the seller's \
                                 identity at the beginning of outbound sales calls.".to_string(),
                recommended_fix: "Hi, my name is [Name] calling from [Company Name].".to_string(),
                legal_reference: "16 C.F.R. § 310.4(d)(1)".to_string(),
                enabled: true,
                optional: false,
            },
            Rule {
                id: "DISC-002".to_string(),
                title: "Missing Sales Call Nature Disclosure".to_string(),
                category: RuleCategory::Disclosure,
                description: "Agent did not disclose that the call is a sales call".to_string(),
                severity: Severity::Medium,
                triggers: vec![],
                regex_patterns: vec![
                    r"(?i)(sales|marketing|promotion|offer|special\s+deal|opportunity)".to_string(),
                ],
                requires_metadata: false,
                metadata_field: None,
                why_it_matters: "The TSR requires disclosure that the call is for sales purposes \
                                 before making the sales pitch.".to_string(),
                recommended_fix: "I'm calling today with a special offer for you...".to_string(),
                legal_reference: "16 C.F.R. § 310.4(d)(2)".to_string(),
                enabled: true,
                optional: false,
            },
            Rule {
                id: "DISC-003".to_string(),
                title: "Missing Product/Service Description".to_string(),
                category: RuleCategory::Disclosure,
                description: "Agent proceeded with pitch without describing what is being sold".to_string(),
                severity: Severity::Low,
                triggers: vec![],
                regex_patterns: vec![],
                requires_metadata: false,
                metadata_field: None,
                why_it_matters: "Consumers should understand what product or service is being offered \
                                 early in the call.".to_string(),
                recommended_fix: "The reason for my call is to tell you about our [product/service]...".to_string(),
                legal_reference: "16 C.F.R. § 310.4(d)(3)".to_string(),
                enabled: true,
                optional: false,
            },
            
            // Consent Rules
            Rule {
                id: "CONS-001".to_string(),
                title: "Consent Revocation Detected".to_string(),
                category: RuleCategory::Consent,
                description: "Consumer appears to be revoking consent by reasonable means".to_string(),
                severity: Severity::High,
                triggers: vec![
                    "i withdraw my consent".to_string(),
                    "i revoke my consent".to_string(),
                    "i take back my consent".to_string(),
                    "i no longer consent".to_string(),
                    "i didn't agree to this".to_string(),
                    "i never agreed".to_string(),
                    "i want to opt out".to_string(),
                    "opt me out".to_string(),
                    "unsubscribe me".to_string(),
                ],
                regex_patterns: vec![
                    r"(?i)(withdraw|revoke|take\s+back|cancel)\s+(my\s+)?(consent|permission|authorization)".to_string(),
                    r"(?i)(opt|unsubscribe)\s+(me\s+)?out".to_string(),
                    r"(?i)(never|didn'?t)\s+(agree|consent|authorize)".to_string(),
                ],
                requires_metadata: false,
                metadata_field: None,
                why_it_matters: "Under TCPA, consumers can revoke consent by any reasonable means. \
                                 Non-standard wording still constitutes valid revocation.".to_string(),
                recommended_fix: "I understand you'd like to revoke your consent. I'll process that right away \
                                  and you'll be removed from our calling list.".to_string(),
                legal_reference: "47 C.F.R. § 64.1200(a)(7)(ii)".to_string(),
                enabled: true,
                optional: false,
            },
            
            // Identification Rules  
            Rule {
                id: "IDENT-001".to_string(),
                title: "Missing Callback Number".to_string(),
                category: RuleCategory::Identification,
                description: "Agent did not provide callback number/address for consumer contact".to_string(),
                severity: Severity::Low,
                triggers: vec![],
                regex_patterns: vec![
                    r"(?i)(call\s+(us\s+)?back\s+at|reach\s+us\s+at|our\s+number\s+is|contact\s+us\s+at)".to_string(),
                ],
                requires_metadata: false,
                metadata_field: None,
                why_it_matters: "Telemarketers must provide a means for consumers to reach the business, \
                                 typically a callback number.".to_string(),
                recommended_fix: "If you have any questions, you can reach us at [phone number].".to_string(),
                legal_reference: "16 C.F.R. § 310.4(d)(7)".to_string(),
                enabled: true,
                optional: false,
            },
            
            // Prerecorded Voice Rules
            Rule {
                id: "PREC-001".to_string(),
                title: "Prerecorded Voice Without Consent".to_string(),
                category: RuleCategory::Prerecorded,
                description: "Call using prerecorded/artificial voice without required prior express written consent".to_string(),
                severity: Severity::High,
                triggers: vec![],
                regex_patterns: vec![],
                requires_metadata: true,
                metadata_field: Some("is_prerecorded".to_string()),
                why_it_matters: "TCPA requires prior express written consent for prerecorded telemarketing \
                                 calls to cell phones.".to_string(),
                recommended_fix: "Ensure written consent is obtained and documented before using \
                                  prerecorded messages for marketing.".to_string(),
                legal_reference: "47 U.S.C. § 227(b)(1)(A)".to_string(),
                enabled: true,
                optional: false,
            },
            
            // Recording Disclosure Rules (Optional Module)
            Rule {
                id: "REC-001".to_string(),
                title: "Missing Recording Disclosure".to_string(),
                category: RuleCategory::RecordingDisclosure,
                description: "Call is being recorded without disclosure (jurisdiction-dependent)".to_string(),
                severity: Severity::Medium,
                triggers: vec![],
                regex_patterns: vec![
                    r"(?i)(this\s+call\s+(is|may\s+be)\s+(being\s+)?recorded|call\s+recording|for\s+quality\s+(and\s+training\s+)?purposes)".to_string(),
                ],
                requires_metadata: false,
                metadata_field: None,
                why_it_matters: "Some states require two-party consent for call recording. \
                                 This rule is jurisdiction-dependent and should be reviewed with counsel.".to_string(),
                recommended_fix: "This call may be recorded for quality and training purposes. \
                                  By continuing, you consent to this recording.".to_string(),
                legal_reference: "State-specific wiretapping/recording consent laws".to_string(),
                enabled: true,
                optional: true,
            },
        ]
    }
    
    /// Get a rule by ID
    pub fn get_rule(&self, id: &str) -> Option<&Rule> {
        self.rules.iter().find(|r| r.id == id)
    }
    
    /// Get all enabled rules
    pub fn get_enabled_rules(&self) -> Vec<&Rule> {
        self.rules.iter().filter(|r| r.enabled).collect()
    }
    
    /// Get rules by category
    pub fn get_rules_by_category(&self, category: RuleCategory) -> Vec<&Rule> {
        self.rules.iter().filter(|r| r.category == category).collect()
    }
    
    /// Generate YAML representation for LLM prompt
    pub fn to_yaml(&self) -> String {
        let mut yaml = String::new();
        yaml.push_str(&format!("# TCPA Compliance Rules v{}\n\n", self.version));
        
        for rule in &self.rules {
            if !rule.enabled {
                continue;
            }
            yaml.push_str(&format!("## {} - {}\n", rule.id, rule.title));
            yaml.push_str(&format!("- Category: {:?}\n", rule.category));
            yaml.push_str(&format!("- Severity: {:?}\n", rule.severity));
            yaml.push_str(&format!("- Description: {}\n", rule.description));
            yaml.push_str(&format!("- Why it matters: {}\n", rule.why_it_matters));
            yaml.push_str(&format!("- Recommended fix: \"{}\"\n", rule.recommended_fix));
            yaml.push_str(&format!("- Legal reference: {}\n", rule.legal_reference));
            if !rule.triggers.is_empty() {
                yaml.push_str(&format!("- Trigger phrases: {:?}\n", rule.triggers));
            }
            yaml.push_str("\n");
        }
        
        yaml
    }
}
