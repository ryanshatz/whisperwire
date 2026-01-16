'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Mic, Phone, PhoneOff, MessageSquare, AlertTriangle,
    Sparkles, Copy, Check, Send, User, Headphones,
    RotateCcw, Settings, Zap, Shield, Clock, ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { Alert, TranscriptSegment, CallMetadata, SuggestedLine } from '@/types';
import { evaluateTranscript, resetEvaluatorState } from '@/lib/evaluator';

interface AgentViewProps {
    llmStatus: { available: boolean; model: string } | null;
}

export default function AgentView({ llmStatus }: AgentViewProps) {
    // Call state
    const [callActive, setCallActive] = useState(false);
    const [callMetadata, setCallMetadata] = useState<CallMetadata>({
        call_id: '',
        agent_id: 'agent-001',
        agent_name: 'Current Agent',
        call_start_time: '',
        caller_timezone: 'America/New_York',
        is_dnc_listed: false,
        has_prior_consent: true,
        is_prerecorded: false,
        call_type: 'outbound_sales',
    });

    // Transcript state
    const [segments, setSegments] = useState<TranscriptSegment[]>([]);
    const [inputText, setInputText] = useState('');
    const [currentSpeaker, setCurrentSpeaker] = useState<'agent' | 'customer'>('customer');

    // Alerts & suggestions
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [suggestions, setSuggestions] = useState<SuggestedLine[]>([]);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [expandedAlert, setExpandedAlert] = useState<string | null>(null);

    // Refs
    const transcriptRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-scroll transcript
    useEffect(() => {
        if (transcriptRef.current) {
            transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
        }
    }, [segments]);

    // Start call
    const startCall = useCallback(() => {
        const callId = `call-${Date.now()}`;
        setCallMetadata(prev => ({
            ...prev,
            call_id: callId,
            call_start_time: new Date().toISOString(),
        }));
        setCallActive(true);
        setSegments([]);
        setAlerts([]);
        setSuggestions([]);
        resetEvaluatorState();
        toast.success('Call started - monitoring active');
    }, []);

    // End call
    const endCall = useCallback(() => {
        setCallActive(false);
        toast.success(`Call ended - ${alerts.length} alerts detected`);
    }, [alerts.length]);

    // Add transcript segment
    const addSegment = useCallback((speaker: 'agent' | 'customer', text: string) => {
        if (!text.trim()) return;

        const charOffset = segments.reduce((acc, s) => acc + s.text.length + 1, 0);

        const newSegment: TranscriptSegment = {
            id: `seg-${Date.now()}`,
            speaker,
            text: text.trim(),
            timestamp_ms: Date.now() - new Date(callMetadata.call_start_time).getTime(),
            start_char: charOffset,
            end_char: charOffset + text.trim().length,
        };

        setSegments(prev => [...prev, newSegment]);

        // Build full transcript for evaluation
        const fullTranscript = [...segments, newSegment]
            .map(s => `[${s.speaker.toUpperCase()}]: ${s.text}`)
            .join('\n');

        // Evaluate transcript
        const result = evaluateTranscript(callMetadata, [...segments, newSegment], fullTranscript);

        // Add new alerts
        if (result.alerts.length > 0) {
            setAlerts(prev => {
                const newAlerts = result.alerts.filter(a => !prev.some(p => p.rule_id === a.rule_id));
                newAlerts.forEach(alert => {
                    const toastType = alert.severity === 'high' ? toast.error : toast;
                    toastType(`⚠️ ${alert.title}`, {
                        duration: 5000,
                        icon: alert.severity === 'high' ? '🚨' : '⚠️',
                    });
                });
                return [...prev, ...newAlerts];
            });
        }

        // Update suggestions
        if (result.suggested_next_lines.length > 0) {
            setSuggestions(result.suggested_next_lines);
        }
    }, [segments, callMetadata]);

    // Handle input submit
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim() || !callActive) return;

        addSegment(currentSpeaker, inputText);
        setInputText('');

        // Toggle speaker for natural conversation
        setCurrentSpeaker(prev => prev === 'agent' ? 'customer' : 'agent');
    };

    // Copy to clipboard
    const copyToClipboard = async (text: string, id: string) => {
        await navigator.clipboard.writeText(text);
        setCopiedId(id);
        toast.success('Copied to clipboard');
        setTimeout(() => setCopiedId(null), 2000);
    };

    // Format timestamp
    const formatTime = (ms: number) => {
        const seconds = Math.floor(ms / 1000);
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Get alert for segment
    const getAlertForSegment = (segment: TranscriptSegment) => {
        return alerts.find(a =>
            segment.start_char <= a.evidence.start_char &&
            segment.end_char >= a.evidence.start_char
        );
    };

    return (
        <div className="dashboard-grid animate-fadeIn">
            {/* Main Transcript Area */}
            <div className="card">
                {/* Call Controls Header */}
                <div className="card-header">
                    <div className="card-title">
                        <div className="card-title-icon" style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))' }}>
                            <MessageSquare size={16} color="white" />
                        </div>
                        <span>Live Transcript</span>
                        {callActive && (
                            <span className="status-pill active" style={{ marginLeft: '0.5rem' }}>
                                <span className="status-dot" />
                                Recording
                            </span>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {!callActive ? (
                            <button onClick={startCall} className="btn btn-primary">
                                <Phone size={14} />
                                Start Call
                            </button>
                        ) : (
                            <>
                                <button onClick={endCall} className="btn btn-secondary" style={{ borderColor: 'var(--severity-high)', color: 'var(--severity-high)' }}>
                                    <PhoneOff size={14} />
                                    End Call
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Call Metadata */}
                {callActive && (
                    <motion.div
                        className="call-controls"
                        style={{ margin: '1rem', marginBottom: 0 }}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className="call-info">
                            <span className="call-info-label">Call ID</span>
                            <span className="call-info-value" style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                                {callMetadata.call_id}
                            </span>
                        </div>

                        <div className="call-info">
                            <span className="call-info-label">Duration</span>
                            <span className="call-info-value">
                                <Clock size={12} style={{ marginRight: '0.375rem', opacity: 0.5 }} />
                                {callActive && callMetadata.call_start_time ?
                                    formatTime(Date.now() - new Date(callMetadata.call_start_time).getTime()) :
                                    '0:00'
                                }
                            </span>
                        </div>

                        <div className="metadata-tags">
                            <span className="metadata-tag">
                                <Shield size={10} />
                                {callMetadata.call_type}
                            </span>
                            {callMetadata.is_dnc_listed && (
                                <span className="metadata-tag warning">
                                    <AlertTriangle size={10} />
                                    DNC Listed
                                </span>
                            )}
                            {!callMetadata.has_prior_consent && (
                                <span className="metadata-tag warning">
                                    <AlertTriangle size={10} />
                                    No Consent
                                </span>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* Transcript Content */}
                <div ref={transcriptRef} className="transcript-container">
                    {segments.length === 0 ? (
                        <div className="transcript-empty">
                            <div className="transcript-empty-icon">
                                <Headphones size={28} strokeWidth={1.5} />
                            </div>
                            <p style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>
                                {callActive ? 'Waiting for conversation...' : 'No active call'}
                            </p>
                            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', maxWidth: 300 }}>
                                {callActive
                                    ? 'Type messages below to simulate the conversation'
                                    : 'Click "Start Call" to begin monitoring'
                                }
                            </p>
                        </div>
                    ) : (
                        <AnimatePresence>
                            {segments.map((segment) => {
                                const alert = getAlertForSegment(segment);
                                return (
                                    <motion.div
                                        key={segment.id}
                                        className={`message ${segment.speaker}`}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <div className={`message-avatar ${segment.speaker}`}>
                                            {segment.speaker === 'agent' ? (
                                                <Headphones size={14} color="white" />
                                            ) : (
                                                <User size={14} color="white" />
                                            )}
                                        </div>

                                        <div className="message-content">
                                            <div className="message-meta">
                                                <span style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>
                                                    {segment.speaker === 'agent' ? callMetadata.agent_name : 'Customer'}
                                                </span>
                                                <span>{formatTime(segment.timestamp_ms)}</span>
                                            </div>
                                            <div className={`message-bubble ${alert ? (alert.severity === 'high' ? 'has-alert' : 'has-alert-medium') : ''}`}>
                                                {segment.text}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    )}
                </div>

                {/* Input Area */}
                {callActive && (
                    <div className="input-area">
                        <form onSubmit={handleSubmit} className="input-row">
                            <select
                                value={currentSpeaker}
                                onChange={(e) => setCurrentSpeaker(e.target.value as 'agent' | 'customer')}
                                className="select"
                                style={{ width: 'auto' }}
                                aria-label="Select speaker"
                            >
                                <option value="agent">Agent</option>
                                <option value="customer">Customer</option>
                            </select>

                            <input
                                ref={inputRef}
                                type="text"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder="Type what was said..."
                                className="input-field"
                                aria-label="Transcript input"
                            />

                            <button type="submit" className="btn btn-primary" disabled={!inputText.trim()}>
                                <Send size={14} />
                                Add
                            </button>
                        </form>
                    </div>
                )}
            </div>

            {/* Sidebar - Alerts & Suggestions */}
            <div className="sidebar">
                {/* Alerts Panel */}
                <div className="card" style={{ flex: '1 1 auto', minHeight: 0 }}>
                    <div className="card-header">
                        <div className="card-title">
                            <div className="card-title-icon" style={{ background: 'var(--severity-high-bg)', color: 'var(--severity-high)' }}>
                                <AlertTriangle size={16} />
                            </div>
                            <span>Compliance Alerts</span>
                            {alerts.length > 0 && (
                                <span className="badge badge-high" style={{ marginLeft: '0.5rem' }}>
                                    {alerts.length}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="card-body" style={{ overflow: 'auto', maxHeight: 'calc(50vh - 100px)' }}>
                        {alerts.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-state-icon">
                                    <Shield size={20} />
                                </div>
                                <p className="empty-state-title">No alerts yet</p>
                                <p className="empty-state-desc">
                                    Compliance issues will appear here as they're detected
                                </p>
                            </div>
                        ) : (
                            <AnimatePresence>
                                {alerts.map((alert) => (
                                    <motion.div
                                        key={alert.id}
                                        className={`alert-card severity-${alert.severity}`}
                                        onClick={() => setExpandedAlert(expandedAlert === alert.id ? null : alert.id)}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <div className="alert-header">
                                            <div>
                                                <h4 className="alert-title">{alert.title}</h4>
                                                <div className="alert-badges">
                                                    <span className={`badge badge-${alert.severity}`}>
                                                        {alert.severity}
                                                    </span>
                                                    <span className="badge badge-rule">{alert.rule_id}</span>
                                                    <span className="badge badge-confidence">{alert.confidence}%</span>
                                                </div>
                                            </div>
                                            <ChevronRight
                                                size={14}
                                                style={{
                                                    color: 'var(--text-muted)',
                                                    transform: expandedAlert === alert.id ? 'rotate(90deg)' : 'none',
                                                    transition: 'transform 0.2s'
                                                }}
                                            />
                                        </div>

                                        {alert.evidence.quote && (
                                            <div className="alert-quote">
                                                "{alert.evidence.quote}"
                                            </div>
                                        )}

                                        <AnimatePresence>
                                            {expandedAlert === alert.id && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    style={{ overflow: 'hidden' }}
                                                >
                                                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                                                        {alert.why_it_matters}
                                                    </p>

                                                    {alert.agent_fix_suggestion && (
                                                        <div style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '0.5rem',
                                                            padding: '0.75rem',
                                                            background: 'var(--bg-base)',
                                                            borderRadius: '8px',
                                                            marginTop: '0.5rem'
                                                        }}>
                                                            <span style={{ flex: 1, fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                                                                💬 {alert.agent_fix_suggestion}
                                                            </span>
                                                            <button
                                                                className={`btn-copy ${copiedId === alert.id ? 'copied' : ''}`}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    copyToClipboard(alert.agent_fix_suggestion, alert.id);
                                                                }}
                                                            >
                                                                {copiedId === alert.id ? <Check size={10} /> : <Copy size={10} />}
                                                                {copiedId === alert.id ? 'Copied' : 'Copy'}
                                                            </button>
                                                        </div>
                                                    )}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        )}
                    </div>
                </div>

                {/* Suggestions Panel */}
                <div className="card" style={{ flex: '0 0 auto' }}>
                    <div className="card-header">
                        <div className="card-title">
                            <div className="card-title-icon" style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.2))', color: 'var(--primary-light)' }}>
                                <Sparkles size={16} />
                            </div>
                            <span>What to Say Next</span>
                        </div>
                    </div>

                    <div className="card-body">
                        {suggestions.length === 0 ? (
                            <div className="empty-state" style={{ padding: '1.5rem 1rem' }}>
                                <p className="empty-state-desc">
                                    Compliant response suggestions will appear here
                                </p>
                            </div>
                        ) : (
                            suggestions.map((suggestion, i) => (
                                <div key={i} className="suggestion-card">
                                    <p className="suggestion-text">{suggestion.text}</p>
                                    <div className="suggestion-footer">
                                        <span className="suggestion-confidence">
                                            {suggestion.confidence}% confidence
                                        </span>
                                        <button
                                            className={`btn-copy ${copiedId === `sug-${i}` ? 'copied' : ''}`}
                                            onClick={() => copyToClipboard(suggestion.text, `sug-${i}`)}
                                        >
                                            {copiedId === `sug-${i}` ? <Check size={10} /> : <Copy size={10} />}
                                            {copiedId === `sug-${i}` ? 'Copied' : 'Use'}
                                        </button>
                                    </div>
                                    <div className="confidence-bar">
                                        <div
                                            className="confidence-fill"
                                            style={{
                                                width: `${suggestion.confidence}%`,
                                                background: 'linear-gradient(90deg, var(--primary), var(--accent))'
                                            }}
                                        />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
