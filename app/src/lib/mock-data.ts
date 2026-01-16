// Mock data for Admin Dashboard demo

export interface StoredAlert {
    id: string;
    call_id: string;
    agent_id: string;
    agent_name: string;
    rule_id: string;
    title: string;
    severity: 'high' | 'medium' | 'low';
    confidence: number;
    evidence: {
        quote: string;
        start_char: number;
        end_char: number;
    };
    created_at: string;
}

export interface MockAnalytics {
    total_calls: number;
    total_alerts: number;
    alerts_by_severity: {
        high: number;
        medium: number;
        low: number;
    };
    alerts_by_rule: Array<{ rule_id: string; count: number }>;
    alerts_by_agent: Array<{ agent_id: string; agent_name: string; count: number }>;
}

// Realistic mock alerts for demonstration
export const mockAlerts: StoredAlert[] = [
    {
        id: 'alert-001',
        call_id: 'call-20260115-001',
        agent_id: 'agent-001',
        agent_name: 'Sarah Johnson',
        rule_id: 'DNC-001',
        title: 'Customer Requested No Further Calls',
        severity: 'high',
        confidence: 92,
        evidence: { quote: "please don't call me again", start_char: 145, end_char: 172 },
        created_at: '2026-01-15T14:23:45Z',
    },
    {
        id: 'alert-002',
        call_id: 'call-20260115-003',
        agent_id: 'agent-002',
        agent_name: 'Mike Chen',
        rule_id: 'CONS-001',
        title: 'Consent Revocation Detected',
        severity: 'high',
        confidence: 88,
        evidence: { quote: "I withdraw my consent", start_char: 89, end_char: 110 },
        created_at: '2026-01-15T15:12:33Z',
    },
    {
        id: 'alert-003',
        call_id: 'call-20260115-007',
        agent_id: 'agent-001',
        agent_name: 'Sarah Johnson',
        rule_id: 'DISC-001',
        title: 'Missing Seller Identity Disclosure',
        severity: 'medium',
        confidence: 75,
        evidence: { quote: "Hi, I wanted to tell you about a special offer", start_char: 0, end_char: 45 },
        created_at: '2026-01-15T16:45:21Z',
    },
    {
        id: 'alert-004',
        call_id: 'call-20260115-012',
        agent_id: 'agent-003',
        agent_name: 'Emily Davis',
        rule_id: 'DNC-002',
        title: 'Agent Continued After DNC Request',
        severity: 'high',
        confidence: 95,
        evidence: { quote: "But wait, before you go, let me tell you", start_char: 234, end_char: 275 },
        created_at: '2026-01-15T17:08:15Z',
    },
    {
        id: 'alert-005',
        call_id: 'call-20260115-015',
        agent_id: 'agent-002',
        agent_name: 'Mike Chen',
        rule_id: 'DISC-002',
        title: 'Missing Sales Call Nature Disclosure',
        severity: 'medium',
        confidence: 70,
        evidence: { quote: "I'm calling to discuss your account", start_char: 15, end_char: 51 },
        created_at: '2026-01-15T18:22:09Z',
    },
    {
        id: 'alert-006',
        call_id: 'call-20260116-001',
        agent_id: 'agent-004',
        agent_name: 'Alex Rivera',
        rule_id: 'DNC-001',
        title: 'Customer Requested No Further Calls',
        severity: 'high',
        confidence: 91,
        evidence: { quote: "take me off your list", start_char: 167, end_char: 188 },
        created_at: '2026-01-16T09:15:33Z',
    },
    {
        id: 'alert-007',
        call_id: 'call-20260116-005',
        agent_id: 'agent-001',
        agent_name: 'Sarah Johnson',
        rule_id: 'IDENT-001',
        title: 'Missing Callback Number',
        severity: 'low',
        confidence: 68,
        evidence: { quote: "If you have questions, just call us back", start_char: 345, end_char: 385 },
        created_at: '2026-01-16T10:33:45Z',
    },
    {
        id: 'alert-008',
        call_id: 'call-20260116-008',
        agent_id: 'agent-005',
        agent_name: 'Jordan Lee',
        rule_id: 'TIME-001',
        title: 'Calling Time Violation',
        severity: 'high',
        confidence: 98,
        evidence: { quote: 'Call initiated at 7:45 AM local time', start_char: 0, end_char: 0 },
        created_at: '2026-01-16T12:45:00Z',
    },
    {
        id: 'alert-009',
        call_id: 'call-20260116-011',
        agent_id: 'agent-002',
        agent_name: 'Mike Chen',
        rule_id: 'DNC-003',
        title: 'National DNC List - No Consent Evidence',
        severity: 'high',
        confidence: 85,
        evidence: { quote: 'Number flagged as DNC-listed in system metadata', start_char: 0, end_char: 0 },
        created_at: '2026-01-16T11:22:18Z',
    },
    {
        id: 'alert-010',
        call_id: 'call-20260116-014',
        agent_id: 'agent-003',
        agent_name: 'Emily Davis',
        rule_id: 'DISC-003',
        title: 'Missing Product/Service Description',
        severity: 'low',
        confidence: 62,
        evidence: { quote: "We have something that might interest you", start_char: 78, end_char: 119 },
        created_at: '2026-01-16T12:15:42Z',
    },
];

// Analytics summary computed from mock data
export const mockAnalytics: MockAnalytics = {
    total_calls: 847,
    total_alerts: 156,
    alerts_by_severity: {
        high: 68,
        medium: 52,
        low: 36,
    },
    alerts_by_rule: [
        { rule_id: 'DNC-001', count: 42 },
        { rule_id: 'CONS-001', count: 28 },
        { rule_id: 'DNC-003', count: 24 },
        { rule_id: 'TIME-001', count: 22 },
        { rule_id: 'DISC-001', count: 18 },
        { rule_id: 'DNC-002', count: 12 },
        { rule_id: 'DISC-002', count: 6 },
        { rule_id: 'IDENT-001', count: 4 },
    ],
    alerts_by_agent: [
        { agent_id: 'agent-001', agent_name: 'Sarah Johnson', count: 34 },
        { agent_id: 'agent-002', agent_name: 'Mike Chen', count: 28 },
        { agent_id: 'agent-003', agent_name: 'Emily Davis', count: 22 },
        { agent_id: 'agent-004', agent_name: 'Alex Rivera', count: 19 },
        { agent_id: 'agent-005', agent_name: 'Jordan Lee', count: 15 },
    ],
};
