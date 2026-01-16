// Core Types for Whisperwire

export interface CallMetadata {
    call_id: string;
    agent_id: string;
    agent_name: string;
    call_start_time: string;
    caller_timezone?: string;
    customer_phone?: string;
    is_dnc_listed: boolean;
    has_prior_consent: boolean;
    is_prerecorded: boolean;
    call_type: string;
}

export interface TranscriptSegment {
    id: string;
    speaker: 'agent' | 'customer';
    text: string;
    timestamp_ms: number;
    start_char: number;
    end_char: number;
}

export interface Evidence {
    quote: string;
    start_char: number;
    end_char: number;
}

export interface Alert {
    id: string;
    rule_id: string;
    title: string;
    severity: 'high' | 'medium' | 'low';
    confidence: number;
    evidence: Evidence;
    why_it_matters: string;
    agent_fix_suggestion: string;
}

export interface SuggestedLine {
    text: string;
    confidence: number;
}

export interface EvaluationResult {
    alerts: Alert[];
    suggested_next_lines: SuggestedLine[];
    evaluation_time_ms?: number;
    llm_used?: boolean;
}

export interface StoredAlert extends Alert {
    call_id: string;
    agent_id: string;
    agent_name: string;
    created_at: string;
}

export interface AnalyticsData {
    total_calls: number;
    total_alerts: number;
    alerts_by_severity: {
        high: number;
        medium: number;
        low: number;
    };
    alerts_by_rule: Array<{ rule_id: string; count: number }>;
    alerts_by_agent: Array<{ agent_id: string; agent_name: string; count: number }>;
    daily_trend?: Array<{ date: string; count: number }>;
}

export interface LlmStatus {
    available: boolean;
    model: string;
    endpoint?: string;
}

export interface Rule {
    id: string;
    title: string;
    category: string;
    description: string;
    severity: 'high' | 'medium' | 'low';
    triggers: string[];
    regex_patterns: string[];
    requires_metadata: boolean;
    metadata_field?: string;
    why_it_matters: string;
    recommended_fix: string;
    legal_reference: string;
    enabled: boolean;
    optional: boolean;
}
