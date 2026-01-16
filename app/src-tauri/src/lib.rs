mod database;
mod rules;
mod evaluator;
mod llm;

use serde::{Deserialize, Serialize};
use tauri::State;
use std::sync::Mutex;
use tokio::sync::RwLock;

pub use database::Database;
pub use rules::{RuleSet, Rule, RuleCategory};
pub use evaluator::{ComplianceEvaluator, Alert, Evidence, SuggestedLine, EvaluationOutput};
pub use llm::LlmClient;

/// Application state managed by Tauri
pub struct AppState {
    pub db: Mutex<Database>,
    pub rules: RuleSet,
    pub evaluator: ComplianceEvaluator,
    pub llm: RwLock<LlmClient>,
    pub llm_enabled: Mutex<bool>,
}

/// Call metadata for context during evaluation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CallMetadata {
    pub call_id: String,
    pub agent_id: String,
    pub agent_name: String,
    pub call_start_time: String,
    pub caller_timezone: Option<String>,
    pub customer_phone: Option<String>,
    pub is_dnc_listed: bool,
    pub has_prior_consent: bool,
    pub is_prerecorded: bool,
    pub call_type: String,
}

/// Transcript segment for real-time processing
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TranscriptSegment {
    pub id: String,
    pub speaker: String,
    pub text: String,
    pub timestamp_ms: u64,
    pub start_char: usize,
    pub end_char: usize,
}

/// Evaluation result returned to frontend
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EvaluationResult {
    pub alerts: Vec<Alert>,
    pub suggested_next_lines: Vec<SuggestedLine>,
    pub evaluation_time_ms: u64,
    pub llm_used: bool,
}

/// LLM status for frontend
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LlmStatus {
    pub available: bool,
    pub model: String,
    pub endpoint: String,
}

/// Initialize and check LLM connection
#[tauri::command]
async fn check_llm_status(state: State<'_, AppState>) -> Result<LlmStatus, String> {
    let mut llm = state.llm.write().await;
    let connected = llm.check_connection().await.unwrap_or(false);
    
    *state.llm_enabled.lock().unwrap() = connected;
    
    Ok(LlmStatus {
        available: connected,
        model: llm.get_model().to_string(),
        endpoint: "http://localhost:11434".to_string(),
    })
}

/// Set LLM model
#[tauri::command]
async fn set_llm_model(state: State<'_, AppState>, model: String) -> Result<LlmStatus, String> {
    let mut llm = state.llm.write().await;
    llm.set_model(model);
    let connected = llm.check_connection().await.unwrap_or(false);
    
    *state.llm_enabled.lock().unwrap() = connected;
    
    Ok(LlmStatus {
        available: connected,
        model: llm.get_model().to_string(),
        endpoint: "http://localhost:11434".to_string(),
    })
}

/// Evaluate transcript for compliance issues
#[tauri::command]
async fn evaluate_transcript(
    state: State<'_, AppState>,
    metadata: CallMetadata,
    transcript: String,
    use_llm: bool,
) -> Result<EvaluationResult, String> {
    let start = std::time::Instant::now();
    
    let llm_enabled = *state.llm_enabled.lock().unwrap();
    let should_use_llm = use_llm && llm_enabled;
    
    let result = if should_use_llm {
        // Use LLM for evaluation
        let llm = state.llm.read().await;
        let rules_yaml = state.rules.to_yaml();
        let metadata_str = serde_json::to_string_pretty(&metadata).unwrap_or_default();
        
        match llm.evaluate(&metadata_str, &transcript, &rules_yaml).await {
            Ok(llm_result) => {
                // Convert LLM response to our format
                EvaluationOutput {
                    alerts: llm_result.alerts.into_iter().map(|a| Alert {
                        id: uuid::Uuid::new_v4().to_string(),
                        rule_id: a.rule_id,
                        title: a.title,
                        severity: a.severity,
                        confidence: a.confidence,
                        evidence: Evidence {
                            quote: a.evidence.quote,
                            start_char: a.evidence.start_char,
                            end_char: a.evidence.end_char,
                        },
                        why_it_matters: a.why_it_matters,
                        agent_fix_suggestion: a.agent_fix_suggestion,
                    }).collect(),
                    suggested_next_lines: llm_result.suggested_next_lines.into_iter().map(|s| SuggestedLine {
                        text: s.text,
                        confidence: s.confidence,
                    }).collect(),
                }
            }
            Err(e) => {
                log::warn!("LLM evaluation failed: {}. Falling back to rules-only.", e);
                // Fallback to regex evaluation
                state.evaluator.evaluate(&metadata, &transcript, &state.rules)?
            }
        }
    } else {
        // Use regex-based evaluation
        state.evaluator.evaluate(&metadata, &transcript, &state.rules)?
    };
    
    let elapsed = start.elapsed().as_millis() as u64;
    
    Ok(EvaluationResult {
        alerts: result.alerts,
        suggested_next_lines: result.suggested_next_lines,
        evaluation_time_ms: elapsed,
        llm_used: should_use_llm,
    })
}

/// Store an alert in the database
#[tauri::command]
async fn store_alert(
    state: State<'_, AppState>,
    alert: Alert,
    metadata: CallMetadata,
) -> Result<String, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.insert_alert(&alert, &metadata).map_err(|e| e.to_string())?;
    Ok(alert.id.clone())
}

/// Get alerts with filters
#[tauri::command]
async fn get_alerts(
    state: State<'_, AppState>,
    start_date: Option<String>,
    end_date: Option<String>,
    agent_id: Option<String>,
    severity: Option<String>,
    rule_id: Option<String>,
    limit: Option<u32>,
    offset: Option<u32>,
) -> Result<Vec<database::StoredAlert>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.get_alerts(start_date, end_date, agent_id, severity, rule_id, limit, offset)
        .map_err(|e| e.to_string())
}

/// Get analytics data
#[tauri::command]
async fn get_analytics(
    state: State<'_, AppState>,
    start_date: String,
    end_date: String,
) -> Result<database::AnalyticsData, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.get_analytics(&start_date, &end_date).map_err(|e| e.to_string())
}

/// Export alerts to JSON
#[tauri::command]
async fn export_alerts_json(
    state: State<'_, AppState>,
    start_date: Option<String>,
    end_date: Option<String>,
) -> Result<String, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let alerts = db.get_alerts(start_date, end_date, None, None, None, None, None)
        .map_err(|e| e.to_string())?;
    serde_json::to_string_pretty(&alerts).map_err(|e| e.to_string())
}

/// Get all rules
#[tauri::command]
async fn get_rules(state: State<'_, AppState>) -> Result<Vec<Rule>, String> {
    Ok(state.rules.rules.clone())
}

/// Get rules as YAML
#[tauri::command]
async fn get_rules_yaml(state: State<'_, AppState>) -> Result<String, String> {
    Ok(state.rules.to_yaml())
}

/// Start a call session
#[tauri::command]
async fn start_call_session(
    state: State<'_, AppState>,
    metadata: CallMetadata,
) -> Result<String, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.start_call_session(&metadata).map_err(|e| e.to_string())?;
    
    // Reset evaluator state for new call
    state.evaluator.reset();
    
    log::info!("Started call session: {}", metadata.call_id);
    Ok(metadata.call_id)
}

/// End a call session
#[tauri::command]
async fn end_call_session(
    state: State<'_, AppState>,
    call_id: String,
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.end_call_session(&call_id).map_err(|e| e.to_string())?;
    log::info!("Ended call session: {}", call_id);
    Ok(())
}

/// Reset evaluator state (for new calls)
#[tauri::command]
async fn reset_evaluator(state: State<'_, AppState>) -> Result<(), String> {
    state.evaluator.reset();
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Initialize database
    let db = Database::new().expect("Failed to initialize database");
    
    // Load ruleset
    let rules = RuleSet::load_default().expect("Failed to load rules");
    
    // Create evaluator
    let evaluator = ComplianceEvaluator::new();
    
    // Create LLM client
    let llm = LlmClient::new(None, None);
    
    // Create app state
    let app_state = AppState {
        db: Mutex::new(db),
        rules,
        evaluator,
        llm: RwLock::new(llm),
        llm_enabled: Mutex::new(false),
    };
    
    tauri::Builder::default()
        .manage(app_state)
        .plugin(tauri_plugin_sql::Builder::default().build())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            log::info!("Whisperwire started");
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            check_llm_status,
            set_llm_model,
            evaluate_transcript,
            store_alert,
            get_alerts,
            get_analytics,
            export_alerts_json,
            get_rules,
            get_rules_yaml,
            start_call_session,
            end_call_session,
            reset_evaluator,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
