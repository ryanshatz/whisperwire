use regex::Regex;
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use crate::{CallMetadata, RuleSet, rules::{Rule, Severity}};

/// Evidence for an alert
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Evidence {
    pub quote: String,
    pub start_char: usize,
    pub end_char: usize,
}

/// A compliance alert
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Alert {
    pub id: String,
    pub rule_id: String,
    pub title: String,
    pub severity: String,
    pub confidence: u8,
    pub evidence: Evidence,
    pub why_it_matters: String,
    pub agent_fix_suggestion: String,
}

/// Suggested next line for the agent
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SuggestedLine {
    pub text: String,
    pub confidence: u8,
}

/// Result of evaluation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EvaluationOutput {
    pub alerts: Vec<Alert>,
    pub suggested_next_lines: Vec<SuggestedLine>,
}

/// State tracking for multi-turn detection
#[derive(Debug, Clone, Default)]
struct ConversationState {
    dnc_requested: bool,
    consent_revoked: bool,
    disclosures: DisclosureState,
    seen_alerts: Vec<String>,
}

#[derive(Debug, Clone, Default)]
struct DisclosureState {
    seller_identified: bool,
    sales_purpose_stated: bool,
    product_described: bool,
    callback_provided: bool,
    recording_disclosed: bool,
}

/// Compliance evaluator using regex-based rules (fallback mode)
pub struct ComplianceEvaluator {
    state: Mutex<ConversationState>,
}

impl ComplianceEvaluator {
    pub fn new() -> Self {
        ComplianceEvaluator {
            state: Mutex::new(ConversationState::default()),
        }
    }
    
    /// Reset state for new call
    pub fn reset(&self) {
        let mut state = self.state.lock().unwrap();
        *state = ConversationState::default();
    }
    
    /// Evaluate transcript for compliance issues
    pub fn evaluate(
        &self,
        metadata: &CallMetadata,
        transcript: &str,
        rules: &RuleSet,
    ) -> Result<EvaluationOutput, String> {
        let mut alerts = Vec::new();
        let mut suggestions = Vec::new();
        
        let mut state = self.state.lock().unwrap();
        let transcript_lower = transcript.to_lowercase();
        
        // Get enabled rules
        let enabled_rules: Vec<&Rule> = rules.rules.iter().filter(|r| r.enabled).collect();
        
        // Process each rule
        for rule in enabled_rules {
            // Skip if already alerted for this rule in this session
            if state.seen_alerts.contains(&rule.id) {
                continue;
            }
            
            if let Some(alert) = self.check_rule(metadata, transcript, &transcript_lower, rule, &mut state)? {
                state.seen_alerts.push(alert.rule_id.clone());
                
                // Add suggestion based on alert
                if !rule.recommended_fix.is_empty() {
                    suggestions.push(SuggestedLine {
                        text: rule.recommended_fix.clone(),
                        confidence: 85,
                    });
                }
                
                alerts.push(alert);
            }
        }
        
        // Add contextual suggestions for missing disclosures
        if metadata.call_type == "outbound_sales" && transcript.len() > 100 {
            if !state.disclosures.seller_identified {
                suggestions.push(SuggestedLine {
                    text: "Identify yourself and your company: 'Hi, my name is [Name] calling from [Company Name].'".to_string(),
                    confidence: 80,
                });
            }
            
            if !state.disclosures.sales_purpose_stated {
                suggestions.push(SuggestedLine {
                    text: "Disclose the sales purpose: 'I'm calling today with a special offer for you.'".to_string(),
                    confidence: 80,
                });
            }
        }
        
        // Limit suggestions
        suggestions.truncate(3);
        
        Ok(EvaluationOutput {
            alerts,
            suggested_next_lines: suggestions,
        })
    }
    
    fn check_rule(
        &self,
        metadata: &CallMetadata,
        transcript: &str,
        transcript_lower: &str,
        rule: &Rule,
        state: &mut ConversationState,
    ) -> Result<Option<Alert>, String> {
        // Handle metadata-based rules first
        if rule.requires_metadata {
            return self.check_metadata_rule(metadata, rule);
        }
        
        // Check trigger phrases
        for trigger in &rule.triggers {
            let trigger_lower = trigger.to_lowercase();
            if let Some(pos) = transcript_lower.find(&trigger_lower) {
                let end_pos = pos + trigger.len();
                let context_end = (end_pos + 30).min(transcript.len());
                let quote = transcript[pos..context_end].trim().to_string();
                
                // Handle DNC detection
                if rule.id == "DNC-001" {
                    state.dnc_requested = true;
                }
                
                // DNC-002 only triggers after DNC-001
                if rule.id == "DNC-002" && !state.dnc_requested {
                    return Ok(None);
                }
                
                // Consent revocation
                if rule.id == "CONS-001" {
                    state.consent_revoked = true;
                }
                
                return Ok(Some(Alert {
                    id: uuid::Uuid::new_v4().to_string(),
                    rule_id: rule.id.clone(),
                    title: rule.title.clone(),
                    severity: severity_to_string(&rule.severity),
                    confidence: 90,
                    evidence: Evidence {
                        quote,
                        start_char: pos,
                        end_char: end_pos,
                    },
                    why_it_matters: rule.why_it_matters.clone(),
                    agent_fix_suggestion: rule.recommended_fix.clone(),
                }));
            }
        }
        
        // Check regex patterns
        for pattern in &rule.regex_patterns {
            if let Ok(re) = Regex::new(pattern) {
                if let Some(m) = re.find(transcript_lower) {
                    let start = m.start();
                    let end = m.end();
                    let context_end = (end + 20).min(transcript.len());
                    let quote = transcript[start..context_end].trim().to_string();
                    
                    // Update state for DNC rules
                    if rule.id == "DNC-001" {
                        state.dnc_requested = true;
                    }
                    
                    if rule.id == "DNC-002" && !state.dnc_requested {
                        return Ok(None);
                    }
                    
                    if rule.id == "CONS-001" {
                        state.consent_revoked = true;
                    }
                    
                    // For disclosure rules - these are positive detections
                    match rule.id.as_str() {
                        "DISC-001" => {
                            state.disclosures.seller_identified = true;
                            return Ok(None); // Don't alert on positive match
                        }
                        "DISC-002" => {
                            state.disclosures.sales_purpose_stated = true;
                            return Ok(None);
                        }
                        "DISC-003" => {
                            state.disclosures.product_described = true;
                            return Ok(None);
                        }
                        "IDENT-001" => {
                            state.disclosures.callback_provided = true;
                            return Ok(None);
                        }
                        "REC-001" => {
                            state.disclosures.recording_disclosed = true;
                            return Ok(None);
                        }
                        _ => {}
                    }
                    
                    return Ok(Some(Alert {
                        id: uuid::Uuid::new_v4().to_string(),
                        rule_id: rule.id.clone(),
                        title: rule.title.clone(),
                        severity: severity_to_string(&rule.severity),
                        confidence: 85,
                        evidence: Evidence {
                            quote,
                            start_char: start,
                            end_char: end,
                        },
                        why_it_matters: rule.why_it_matters.clone(),
                        agent_fix_suggestion: rule.recommended_fix.clone(),
                    }));
                }
            }
        }
        
        Ok(None)
    }
    
    fn check_metadata_rule(
        &self,
        metadata: &CallMetadata,
        rule: &Rule,
    ) -> Result<Option<Alert>, String> {
        match rule.id.as_str() {
            "TIME-001" => {
                // Would need actual time parsing - placeholder
                Ok(None)
            }
            "DNC-003" => {
                if metadata.is_dnc_listed && !metadata.has_prior_consent {
                    Ok(Some(Alert {
                        id: uuid::Uuid::new_v4().to_string(),
                        rule_id: rule.id.clone(),
                        title: rule.title.clone(),
                        severity: severity_to_string(&rule.severity),
                        confidence: 95,
                        evidence: Evidence {
                            quote: "Number is on National DNC Registry (metadata flag)".to_string(),
                            start_char: 0,
                            end_char: 0,
                        },
                        why_it_matters: rule.why_it_matters.clone(),
                        agent_fix_suggestion: rule.recommended_fix.clone(),
                    }))
                } else {
                    Ok(None)
                }
            }
            "PREC-001" => {
                if metadata.is_prerecorded && !metadata.has_prior_consent {
                    Ok(Some(Alert {
                        id: uuid::Uuid::new_v4().to_string(),
                        rule_id: rule.id.clone(),
                        title: rule.title.clone(),
                        severity: severity_to_string(&rule.severity),
                        confidence: 95,
                        evidence: Evidence {
                            quote: "Using prerecorded/artificial voice without consent (metadata flag)".to_string(),
                            start_char: 0,
                            end_char: 0,
                        },
                        why_it_matters: rule.why_it_matters.clone(),
                        agent_fix_suggestion: rule.recommended_fix.clone(),
                    }))
                } else {
                    Ok(None)
                }
            }
            _ => Ok(None),
        }
    }
}

fn severity_to_string(severity: &Severity) -> String {
    match severity {
        Severity::Low => "low".to_string(),
        Severity::Medium => "medium".to_string(),
        Severity::High => "high".to_string(),
    }
}
