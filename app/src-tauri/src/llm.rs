use serde::{Deserialize, Serialize};
use std::time::Duration;

/// LLM Client for connecting to local Ollama
pub struct LlmClient {
    endpoint: String,
    model: String,
    enabled: bool,
    client: reqwest::Client,
}

/// LLM response structure matching our required output format
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LlmResponse {
    pub alerts: Vec<LlmAlert>,
    pub suggested_next_lines: Vec<LlmSuggestion>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LlmAlert {
    pub rule_id: String,
    pub title: String,
    pub severity: String,
    pub confidence: u8,
    pub evidence: LlmEvidence,
    pub why_it_matters: String,
    pub agent_fix_suggestion: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LlmEvidence {
    pub quote: String,
    pub start_char: usize,
    pub end_char: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LlmSuggestion {
    pub text: String,
    pub confidence: u8,
}

#[derive(Debug, Deserialize)]
struct OllamaTagsResponse {
    models: Option<Vec<OllamaModel>>,
}

#[derive(Debug, Deserialize)]
struct OllamaModel {
    name: String,
}

#[derive(Debug, Deserialize)]
struct OllamaGenerateResponse {
    response: String,
}

impl LlmClient {
    /// Create a new LLM client
    pub fn new(endpoint: Option<String>, model: Option<String>) -> Self {
        let client = reqwest::Client::builder()
            .timeout(Duration::from_secs(60))
            .build()
            .expect("Failed to create HTTP client");
            
        LlmClient {
            endpoint: endpoint.unwrap_or_else(|| "http://localhost:11434".to_string()),
            model: model.unwrap_or_else(|| "llama3.2:1b".to_string()),
            enabled: false,
            client,
        }
    }
    
    /// Check if Ollama is available and has the required model
    pub async fn check_connection(&mut self) -> Result<bool, String> {
        let url = format!("{}/api/tags", self.endpoint);
        
        match self.client.get(&url).send().await {
            Ok(resp) => {
                if resp.status().is_success() {
                    // Check if our model is available
                    if let Ok(tags) = resp.json::<OllamaTagsResponse>().await {
                        if let Some(models) = tags.models {
                            let model_available = models.iter().any(|m| m.name.starts_with(&self.model.split(':').next().unwrap_or(&self.model)));
                            if model_available {
                                self.enabled = true;
                                log::info!("LLM connected: Ollama with model {}", self.model);
                                return Ok(true);
                            } else {
                                log::warn!("Model {} not found in Ollama. Available models: {:?}", self.model, models.iter().map(|m| &m.name).collect::<Vec<_>>());
                                // Try to pull the model
                                return self.try_pull_model().await;
                            }
                        }
                    }
                    self.enabled = true;
                    Ok(true)
                } else {
                    Err(format!("Ollama returned status: {}", resp.status()))
                }
            }
            Err(e) => {
                log::warn!("Ollama not available: {}. Running in rules-only mode.", e);
                Err(format!("Ollama connection failed: {}", e))
            }
        }
    }
    
    /// Try to pull the model if not available
    async fn try_pull_model(&mut self) -> Result<bool, String> {
        log::info!("Attempting to pull model: {}", self.model);
        
        let url = format!("{}/api/pull", self.endpoint);
        let body = serde_json::json!({
            "name": self.model,
            "stream": false
        });
        
        match self.client.post(&url).json(&body).send().await {
            Ok(resp) => {
                if resp.status().is_success() {
                    self.enabled = true;
                    log::info!("Successfully pulled model: {}", self.model);
                    Ok(true)
                } else {
                    Err(format!("Failed to pull model: {}", resp.status()))
                }
            }
            Err(e) => Err(format!("Failed to pull model: {}", e))
        }
    }
    
    /// Generate the master system prompt with all rules
    pub fn generate_system_prompt(&self, rules_yaml: &str) -> String {
        format!(r#"You are a TCPA compliance evaluator for live call center calls. Analyze transcripts in real-time and identify potential compliance violations.

⚠️ LEGAL DISCLAIMER: This is NOT legal advice. Compliance depends on jurisdiction and requires legal counsel review.

RULES TO EVALUATE:
{}

OUTPUT FORMAT (STRICT JSON ONLY):
{{
  "alerts": [
    {{
      "rule_id": "DNC-001",
      "title": "Customer requested no further calls",
      "severity": "high",
      "confidence": 92,
      "evidence": {{
        "quote": "exact quote from transcript",
        "start_char": 0,
        "end_char": 50
      }},
      "why_it_matters": "brief explanation",
      "agent_fix_suggestion": "what agent should say"
    }}
  ],
  "suggested_next_lines": [
    {{ "text": "compliant response suggestion", "confidence": 88 }}
  ]
}}

RULES:
1. Return ONLY valid JSON - no markdown, no explanation
2. Only flag actual violations with evidence from the transcript
3. Include accurate character positions for evidence quotes
4. Confidence 0-100 based on certainty
5. If no violations, return: {{"alerts": [], "suggested_next_lines": []}}

Analyze the transcript now:"#, rules_yaml)
    }
    
    /// Evaluate transcript using LLM
    pub async fn evaluate(
        &self,
        call_metadata: &str,
        transcript: &str,
        rules_yaml: &str,
    ) -> Result<LlmResponse, String> {
        if !self.enabled {
            return Err("LLM not enabled. Check Ollama connection.".to_string());
        }
        
        let system_prompt = self.generate_system_prompt(rules_yaml);
        
        let user_prompt = format!(
            "CALL METADATA:\n{}\n\nTRANSCRIPT:\n{}\n\nAnalyze and return JSON:",
            call_metadata,
            transcript
        );
        
        let url = format!("{}/api/generate", self.endpoint);
        let request_body = serde_json::json!({
            "model": self.model,
            "prompt": user_prompt,
            "system": system_prompt,
            "stream": false,
            "format": "json",
            "options": {
                "temperature": 0.1,
                "top_p": 0.9,
                "num_predict": 2048
            }
        });
        
        let response = self.client
            .post(&url)
            .json(&request_body)
            .send()
            .await
            .map_err(|e| format!("LLM request failed: {}", e))?;
        
        if !response.status().is_success() {
            return Err(format!("LLM error status: {}", response.status()));
        }
        
        let ollama_response: OllamaGenerateResponse = response
            .json()
            .await
            .map_err(|e| format!("Failed to parse Ollama response: {}", e))?;
        
        // Parse the JSON response from the LLM
        let llm_response: LlmResponse = serde_json::from_str(&ollama_response.response)
            .map_err(|e| format!("Failed to parse LLM JSON output: {}. Raw: {}", e, &ollama_response.response))?;
        
        Ok(llm_response)
    }
    
    /// Check if LLM is enabled
    pub fn is_enabled(&self) -> bool {
        self.enabled
    }
    
    /// Get current model name
    pub fn get_model(&self) -> &str {
        &self.model
    }
    
    /// Set a different model
    pub fn set_model(&mut self, model: String) {
        self.model = model;
        self.enabled = false; // Require re-check
    }
}

impl Default for LlmClient {
    fn default() -> Self {
        Self::new(None, None)
    }
}
