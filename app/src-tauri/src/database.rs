use rusqlite::{Connection, params};
use serde::{Deserialize, Serialize};
use crate::{Alert, CallMetadata};

/// Stored alert with full context
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StoredAlert {
    pub id: String,
    pub call_id: String,
    pub agent_id: String,
    pub agent_name: String,
    pub rule_id: String,
    pub title: String,
    pub severity: String,
    pub confidence: u8,
    pub quote: String,
    pub start_char: usize,
    pub end_char: usize,
    pub why_it_matters: String,
    pub agent_fix_suggestion: String,
    pub created_at: String,
}

/// Analytics summary data
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnalyticsData {
    pub total_calls: u32,
    pub total_alerts: u32,
    pub alerts_by_severity: AlertsBySeverity,
    pub alerts_by_rule: Vec<RuleAlertCount>,
    pub alerts_by_agent: Vec<AgentAlertCount>,
    pub daily_trend: Vec<DailyAlertCount>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AlertsBySeverity {
    pub high: u32,
    pub medium: u32,
    pub low: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RuleAlertCount {
    pub rule_id: String,
    pub count: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentAlertCount {
    pub agent_id: String,
    pub agent_name: String,
    pub count: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DailyAlertCount {
    pub date: String,
    pub count: u32,
}

pub struct Database {
    conn: Connection,
}

impl Database {
    pub fn new() -> Result<Self, rusqlite::Error> {
        let conn = Connection::open("whisperwire.db")?;
        
        // Create tables
        conn.execute_batch(r#"
            CREATE TABLE IF NOT EXISTS calls (
                call_id TEXT PRIMARY KEY,
                agent_id TEXT NOT NULL,
                agent_name TEXT NOT NULL,
                call_start_time TEXT NOT NULL,
                call_end_time TEXT,
                caller_timezone TEXT,
                is_dnc_listed INTEGER NOT NULL DEFAULT 0,
                has_prior_consent INTEGER NOT NULL DEFAULT 0,
                is_prerecorded INTEGER NOT NULL DEFAULT 0,
                call_type TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
            
            CREATE TABLE IF NOT EXISTS alerts (
                id TEXT PRIMARY KEY,
                call_id TEXT NOT NULL,
                agent_id TEXT NOT NULL,
                agent_name TEXT NOT NULL,
                rule_id TEXT NOT NULL,
                title TEXT NOT NULL,
                severity TEXT NOT NULL,
                confidence INTEGER NOT NULL,
                quote TEXT NOT NULL,
                start_char INTEGER NOT NULL,
                end_char INTEGER NOT NULL,
                why_it_matters TEXT NOT NULL,
                agent_fix_suggestion TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (call_id) REFERENCES calls(call_id)
            );
            
            CREATE INDEX IF NOT EXISTS idx_alerts_call_id ON alerts(call_id);
            CREATE INDEX IF NOT EXISTS idx_alerts_agent_id ON alerts(agent_id);
            CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
            CREATE INDEX IF NOT EXISTS idx_alerts_rule_id ON alerts(rule_id);
            CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at);
        "#)?;
        
        Ok(Database { conn })
    }
    
    pub fn start_call_session(&self, metadata: &CallMetadata) -> Result<(), rusqlite::Error> {
        self.conn.execute(
            r#"INSERT INTO calls (call_id, agent_id, agent_name, call_start_time, caller_timezone, 
                is_dnc_listed, has_prior_consent, is_prerecorded, call_type) 
               VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)"#,
            params![
                metadata.call_id,
                metadata.agent_id,
                metadata.agent_name,
                metadata.call_start_time,
                metadata.caller_timezone,
                metadata.is_dnc_listed as i32,
                metadata.has_prior_consent as i32,
                metadata.is_prerecorded as i32,
                metadata.call_type,
            ],
        )?;
        Ok(())
    }
    
    pub fn end_call_session(&self, call_id: &str) -> Result<(), rusqlite::Error> {
        self.conn.execute(
            "UPDATE calls SET call_end_time = CURRENT_TIMESTAMP WHERE call_id = ?1",
            params![call_id],
        )?;
        Ok(())
    }
    
    pub fn insert_alert(&self, alert: &Alert, metadata: &CallMetadata) -> Result<(), rusqlite::Error> {
        self.conn.execute(
            r#"INSERT INTO alerts (id, call_id, agent_id, agent_name, rule_id, title, severity, 
                confidence, quote, start_char, end_char, why_it_matters, agent_fix_suggestion)
               VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)"#,
            params![
                alert.id,
                metadata.call_id,
                metadata.agent_id,
                metadata.agent_name,
                alert.rule_id,
                alert.title,
                alert.severity,
                alert.confidence,
                alert.evidence.quote,
                alert.evidence.start_char,
                alert.evidence.end_char,
                alert.why_it_matters,
                alert.agent_fix_suggestion,
            ],
        )?;
        Ok(())
    }
    
    pub fn get_alerts(
        &self,
        start_date: Option<String>,
        end_date: Option<String>,
        agent_id: Option<String>,
        severity: Option<String>,
        rule_id: Option<String>,
        limit: Option<u32>,
        offset: Option<u32>,
    ) -> Result<Vec<StoredAlert>, rusqlite::Error> {
        let mut query = String::from(
            "SELECT id, call_id, agent_id, agent_name, rule_id, title, severity, confidence, 
             quote, start_char, end_char, why_it_matters, agent_fix_suggestion, created_at 
             FROM alerts WHERE 1=1"
        );
        
        let mut params_vec: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();
        
        if let Some(ref sd) = start_date {
            query.push_str(" AND created_at >= ?");
            params_vec.push(Box::new(sd.clone()));
        }
        if let Some(ref ed) = end_date {
            query.push_str(" AND created_at <= ?");
            params_vec.push(Box::new(ed.clone()));
        }
        if let Some(ref aid) = agent_id {
            query.push_str(" AND agent_id = ?");
            params_vec.push(Box::new(aid.clone()));
        }
        if let Some(ref sev) = severity {
            query.push_str(" AND severity = ?");
            params_vec.push(Box::new(sev.clone()));
        }
        if let Some(ref rid) = rule_id {
            query.push_str(" AND rule_id = ?");
            params_vec.push(Box::new(rid.clone()));
        }
        
        query.push_str(" ORDER BY created_at DESC");
        
        if let Some(l) = limit {
            query.push_str(&format!(" LIMIT {}", l));
        }
        if let Some(o) = offset {
            query.push_str(&format!(" OFFSET {}", o));
        }
        
        let params_refs: Vec<&dyn rusqlite::ToSql> = params_vec.iter().map(|p| p.as_ref()).collect();
        
        let mut stmt = self.conn.prepare(&query)?;
        let alerts = stmt.query_map(params_refs.as_slice(), |row| {
            Ok(StoredAlert {
                id: row.get(0)?,
                call_id: row.get(1)?,
                agent_id: row.get(2)?,
                agent_name: row.get(3)?,
                rule_id: row.get(4)?,
                title: row.get(5)?,
                severity: row.get(6)?,
                confidence: row.get(7)?,
                quote: row.get(8)?,
                start_char: row.get(9)?,
                end_char: row.get(10)?,
                why_it_matters: row.get(11)?,
                agent_fix_suggestion: row.get(12)?,
                created_at: row.get(13)?,
            })
        })?.collect::<Result<Vec<_>, _>>()?;
        
        Ok(alerts)
    }
    
    pub fn get_analytics(&self, start_date: &str, end_date: &str) -> Result<AnalyticsData, rusqlite::Error> {
        // Total calls
        let total_calls: u32 = self.conn.query_row(
            "SELECT COUNT(*) FROM calls WHERE created_at >= ?1 AND created_at <= ?2",
            params![start_date, end_date],
            |row| row.get(0),
        )?;
        
        // Total alerts
        let total_alerts: u32 = self.conn.query_row(
            "SELECT COUNT(*) FROM alerts WHERE created_at >= ?1 AND created_at <= ?2",
            params![start_date, end_date],
            |row| row.get(0),
        )?;
        
        // Alerts by severity
        let high: u32 = self.conn.query_row(
            "SELECT COUNT(*) FROM alerts WHERE severity = 'high' AND created_at >= ?1 AND created_at <= ?2",
            params![start_date, end_date],
            |row| row.get(0),
        ).unwrap_or(0);
        
        let medium: u32 = self.conn.query_row(
            "SELECT COUNT(*) FROM alerts WHERE severity = 'medium' AND created_at >= ?1 AND created_at <= ?2",
            params![start_date, end_date],
            |row| row.get(0),
        ).unwrap_or(0);
        
        let low: u32 = self.conn.query_row(
            "SELECT COUNT(*) FROM alerts WHERE severity = 'low' AND created_at >= ?1 AND created_at <= ?2",
            params![start_date, end_date],
            |row| row.get(0),
        ).unwrap_or(0);
        
        // Alerts by rule
        let mut stmt = self.conn.prepare(
            "SELECT rule_id, COUNT(*) as count FROM alerts 
             WHERE created_at >= ?1 AND created_at <= ?2 
             GROUP BY rule_id ORDER BY count DESC"
        )?;
        let alerts_by_rule: Vec<RuleAlertCount> = stmt.query_map(params![start_date, end_date], |row| {
            Ok(RuleAlertCount {
                rule_id: row.get(0)?,
                count: row.get(1)?,
            })
        })?.collect::<Result<Vec<_>, _>>()?;
        
        // Alerts by agent
        let mut stmt = self.conn.prepare(
            "SELECT agent_id, agent_name, COUNT(*) as count FROM alerts 
             WHERE created_at >= ?1 AND created_at <= ?2 
             GROUP BY agent_id ORDER BY count DESC"
        )?;
        let alerts_by_agent: Vec<AgentAlertCount> = stmt.query_map(params![start_date, end_date], |row| {
            Ok(AgentAlertCount {
                agent_id: row.get(0)?,
                agent_name: row.get(1)?,
                count: row.get(2)?,
            })
        })?.collect::<Result<Vec<_>, _>>()?;
        
        // Daily trend
        let mut stmt = self.conn.prepare(
            "SELECT DATE(created_at) as date, COUNT(*) as count FROM alerts 
             WHERE created_at >= ?1 AND created_at <= ?2 
             GROUP BY DATE(created_at) ORDER BY date"
        )?;
        let daily_trend: Vec<DailyAlertCount> = stmt.query_map(params![start_date, end_date], |row| {
            Ok(DailyAlertCount {
                date: row.get(0)?,
                count: row.get(1)?,
            })
        })?.collect::<Result<Vec<_>, _>>()?;
        
        Ok(AnalyticsData {
            total_calls,
            total_alerts,
            alerts_by_severity: AlertsBySeverity { high, medium, low },
            alerts_by_rule,
            alerts_by_agent,
            daily_trend,
        })
    }
}
