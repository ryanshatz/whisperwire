'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Phone, PhoneOff, User, UserCircle, AlertTriangle,
    Copy, Check, LightbulbIcon, Clock, ChevronRight,
    MessageSquare, Send, Shield, Download, FileText,
    Volume2, VolumeX, StickyNote, Trash2, History
} from 'lucide-react';
import toast from 'react-hot-toast';
import { evaluateTranscript, resetEvaluatorState } from '@/lib/evaluator';
import type { CallMetadata, TranscriptSegment, Alert, SuggestedLine } from '@/types';

interface AgentViewProps {
    llmStatus: { available: boolean; model: string } | null;
}

function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Calculate compliance score based on alerts
function calculateComplianceScore(alerts: Alert[]): number {
    if (alerts.length === 0) return 100;
    let score = 100;
    for (const alert of alerts) {
        if (alert.severity === 'high') score -= 25;
        else if (alert.severity === 'medium') score -= 10;
        else score -= 5;
    }
    return Math.max(0, score);
}

function getScoreColor(score: number): string {
    if (score >= 80) return 'var(--severity-low)';
    if (score >= 60) return 'var(--severity-medium)';
    return 'var(--severity-high)';
}

export default function AgentView({ llmStatus }: AgentViewProps) {
    // Call state
    const [isCallActive, setIsCallActive] = useState(false);
    const [callMetadata, setCallMetadata] = useState<CallMetadata | null>(null);
    const [callDuration, setCallDuration] = useState(0);
    const [segments, setSegments] = useState<TranscriptSegment[]>([]);
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [suggestions, setSuggestions] = useState<SuggestedLine[]>([]);

    // Input state
    const [inputText, setInputText] = useState('');
    const [speaker, setSpeaker] = useState<'agent' | 'customer'>('agent');
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Feature state
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [notes, setNotes] = useState('');
    const [showNotes, setShowNotes] = useState(false);
    const [callHistory, setCallHistory] = useState<Array<{
        id: string;
        start: string;
        duration: number;
        alertCount: number;
        score: number;
    }>>([]);
    const [showHistory, setShowHistory] = useState(false);
    const [expandedAlert, setExpandedAlert] = useState<string | null>(null);

    // Refs
    const inputRef = useRef<HTMLInputElement>(null);
    const transcriptRef = useRef<HTMLDivElement>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Calculate compliance score
    const complianceScore = useMemo(() => calculateComplianceScore(alerts), [alerts]);

    // Timer effect
    useEffect(() => {
        if (isCallActive) {
            timerRef.current = setInterval(() => {
                setCallDuration(prev => prev + 1);
            }, 1000);
        } else {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        }
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [isCallActive]);

    // Auto-scroll transcript
    useEffect(() => {
        if (transcriptRef.current) {
            transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
        }
    }, [segments]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl+Enter to add message when input focused
            if (e.ctrlKey && e.key === 'Enter' && inputText.trim() && isCallActive) {
                addSegment();
                e.preventDefault();
            }
            // Escape to clear input
            if (e.key === 'Escape') {
                setInputText('');
            }
            // Ctrl+Shift+N to toggle notes
            if (e.ctrlKey && e.shiftKey && e.key === 'N') {
                setShowNotes(prev => !prev);
                e.preventDefault();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [inputText, isCallActive]);

    // Play alert sound
    const playAlertSound = useCallback(() => {
        if (soundEnabled && typeof window !== 'undefined') {
            try {
                // Create a simple beep using Web Audio API
                const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);

                oscillator.frequency.value = 880; // A5 note
                oscillator.type = 'sine';
                gainNode.gain.value = 0.3;

                oscillator.start();
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
                oscillator.stop(audioContext.currentTime + 0.3);
            } catch (e) {
                // Audio not supported
            }
        }
    }, [soundEnabled]);

    const startCall = useCallback(() => {
        const metadata: CallMetadata = {
            call_id: `call-${Date.now()}`,
            agent_id: 'agent-001',
            agent_name: 'Current Agent',
            call_start_time: new Date().toISOString(),
            caller_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            is_dnc_listed: false,
            has_prior_consent: true,
            is_prerecorded: false,
            call_type: 'outbound_sales',
        };

        setCallMetadata(metadata);
        setIsCallActive(true);
        setCallDuration(0);
        setSegments([]);
        setAlerts([]);
        setSuggestions([]);
        setNotes('');
        resetEvaluatorState();

        toast.success('Call started - monitoring active', { icon: '📞' });
    }, []);

    const endCall = useCallback(() => {
        // Save to history
        if (callMetadata) {
            setCallHistory(prev => [{
                id: callMetadata.call_id,
                start: callMetadata.call_start_time,
                duration: callDuration,
                alertCount: alerts.length,
                score: complianceScore,
            }, ...prev.slice(0, 9)]); // Keep last 10 calls
        }

        setIsCallActive(false);
        toast.success(`Call ended - ${alerts.length} alert${alerts.length !== 1 ? 's' : ''} recorded`, {
            icon: '📵',
            duration: 4000
        });
    }, [callMetadata, callDuration, alerts.length, complianceScore]);

    const addSegment = useCallback(() => {
        if (!inputText.trim() || !callMetadata) return;

        const newSegment: TranscriptSegment = {
            id: generateId(),
            speaker,
            text: inputText.trim(),
            timestamp_ms: callDuration * 1000,
            start_char: segments.reduce((acc, s) => acc + s.text.length, 0),
            end_char: segments.reduce((acc, s) => acc + s.text.length, 0) + inputText.trim().length,
        };

        const updatedSegments = [...segments, newSegment];
        setSegments(updatedSegments);
        setInputText('');

        // Build full transcript
        const fullTranscript = updatedSegments.map(s => `${s.speaker}: ${s.text}`).join('\n');

        // Evaluate
        const result = evaluateTranscript(callMetadata, updatedSegments, fullTranscript);

        // Check for new alerts
        const newAlerts = result.alerts.filter(
            alert => !alerts.some(a => a.rule_id === alert.rule_id)
        );

        if (newAlerts.length > 0) {
            setAlerts(prev => [...prev, ...newAlerts]);
            setSuggestions(result.suggested_next_lines);

            // Play sound for high severity alerts
            const hasHighSeverity = newAlerts.some(a => a.severity === 'high');
            if (hasHighSeverity) {
                playAlertSound();
            }

            // Toast for each new alert
            newAlerts.forEach(alert => {
                const icon = alert.severity === 'high' ? '🚨' : alert.severity === 'medium' ? '⚠️' : 'ℹ️';
                toast(alert.title, {
                    icon,
                    duration: 5000,
                    style: {
                        borderLeft: `4px solid var(--severity-${alert.severity})`,
                    },
                });
            });
        }

        // Focus input for next message
        inputRef.current?.focus();
    }, [inputText, speaker, callMetadata, segments, alerts, callDuration, playAlertSound]);

    const copyToClipboard = async (text: string, id: string) => {
        await navigator.clipboard.writeText(text);
        setCopiedId(id);
        toast.success('Copied to clipboard');
        setTimeout(() => setCopiedId(null), 2000);
    };

    const exportTranscript = useCallback(() => {
        if (!callMetadata || segments.length === 0) return;

        let content = `WHISPERWIRE CALL TRANSCRIPT\n`;
        content += `${'='.repeat(50)}\n\n`;
        content += `Call ID: ${callMetadata.call_id}\n`;
        content += `Date: ${new Date(callMetadata.call_start_time).toLocaleString()}\n`;
        content += `Duration: ${formatDuration(callDuration)}\n`;
        content += `Compliance Score: ${complianceScore}%\n`;
        content += `Total Alerts: ${alerts.length}\n\n`;
        content += `${'='.repeat(50)}\n`;
        content += `TRANSCRIPT\n`;
        content += `${'='.repeat(50)}\n\n`;

        segments.forEach(seg => {
            const time = formatDuration(Math.floor(seg.timestamp_ms / 1000));
            content += `[${time}] ${seg.speaker.toUpperCase()}: ${seg.text}\n`;
        });

        if (alerts.length > 0) {
            content += `\n${'='.repeat(50)}\n`;
            content += `COMPLIANCE ALERTS\n`;
            content += `${'='.repeat(50)}\n\n`;

            alerts.forEach(alert => {
                content += `[${alert.severity.toUpperCase()}] ${alert.rule_id}: ${alert.title}\n`;
                content += `  Evidence: "${alert.evidence.quote}"\n`;
                content += `  Confidence: ${alert.confidence}%\n\n`;
            });
        }

        if (notes.trim()) {
            content += `\n${'='.repeat(50)}\n`;
            content += `AGENT NOTES\n`;
            content += `${'='.repeat(50)}\n\n`;
            content += notes;
        }

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `transcript-${callMetadata.call_id}.txt`;
        link.click();
        URL.revokeObjectURL(url);

        toast.success('Transcript exported');
    }, [callMetadata, segments, alerts, callDuration, complianceScore, notes]);

    const clearHistory = useCallback(() => {
        setCallHistory([]);
        toast.success('Call history cleared');
    }, []);

    return (
        <div className="agent-view">
            {/* Main Content */}
            <div className="agent-main">
                {/* Transcript Card */}
                <div className="card transcript-card">
                    <div className="card-header">
                        <div className="card-title">
                            <div className="card-title-icon">
                                <MessageSquare size={16} />
                            </div>
                            <span>Live Transcript</span>
                            {isCallActive && (
                                <span className="badge badge-recording">
                                    <span className="recording-dot" />
                                    Recording
                                </span>
                            )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {/* Compliance Score */}
                            {isCallActive && (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.375rem 0.75rem',
                                    borderRadius: 20,
                                    background: 'var(--bg-elevated)',
                                    border: '1px solid var(--border)'
                                }}>
                                    <Shield size={14} style={{ color: getScoreColor(complianceScore) }} />
                                    <span style={{
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        color: getScoreColor(complianceScore)
                                    }}>
                                        {complianceScore}%
                                    </span>
                                </div>
                            )}

                            {/* Sound Toggle */}
                            <button
                                className="btn-ghost"
                                onClick={() => setSoundEnabled(!soundEnabled)}
                                aria-label={soundEnabled ? 'Mute alerts' : 'Unmute alerts'}
                                title={soundEnabled ? 'Sound on' : 'Sound off'}
                            >
                                {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                            </button>

                            {/* Notes Toggle */}
                            <button
                                className={`btn-ghost ${showNotes ? 'active' : ''}`}
                                onClick={() => setShowNotes(!showNotes)}
                                aria-label="Toggle notes"
                                title="Notes (Ctrl+Shift+N)"
                            >
                                <StickyNote size={16} />
                            </button>

                            {/* History Toggle */}
                            <button
                                className={`btn-ghost ${showHistory ? 'active' : ''}`}
                                onClick={() => setShowHistory(!showHistory)}
                                aria-label="Toggle call history"
                                title="Call history"
                            >
                                <History size={16} />
                            </button>

                            {/* Export Button */}
                            {segments.length > 0 && (
                                <button
                                    className="btn btn-secondary"
                                    onClick={exportTranscript}
                                    style={{ padding: '0.375rem 0.75rem' }}
                                >
                                    <Download size={14} />
                                    Export
                                </button>
                            )}

                            {/* Start/End Call */}
                            {!isCallActive ? (
                                <button className="btn btn-primary" onClick={startCall}>
                                    <Phone size={14} />
                                    Start Call
                                </button>
                            ) : (
                                <button className="btn btn-danger" onClick={endCall}>
                                    <PhoneOff size={14} />
                                    End Call
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="card-body" style={{ padding: 0, display: 'flex', flexDirection: 'column', minHeight: 400 }}>
                        {/* Call Metadata Bar */}
                        {isCallActive && callMetadata && (
                            <div className="call-metadata-bar">
                                <div className="metadata-item">
                                    <span className="metadata-label">CALL ID</span>
                                    <span className="metadata-value">{callMetadata.call_id}</span>
                                </div>
                                <div className="metadata-item">
                                    <span className="metadata-label">DURATION</span>
                                    <span className="metadata-value">
                                        <Clock size={12} />
                                        {formatDuration(callDuration)}
                                    </span>
                                </div>
                                <div className="metadata-item">
                                    <span className="metadata-label">TYPE</span>
                                    <span className="metadata-value badge">{callMetadata.call_type}</span>
                                </div>
                            </div>
                        )}

                        {/* Call History Panel */}
                        <AnimatePresence>
                            {showHistory && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="history-panel"
                                >
                                    <div className="history-header">
                                        <span>Recent Calls ({callHistory.length})</span>
                                        {callHistory.length > 0 && (
                                            <button className="btn-ghost" onClick={clearHistory}>
                                                <Trash2 size={12} />
                                                Clear
                                            </button>
                                        )}
                                    </div>
                                    {callHistory.length === 0 ? (
                                        <div className="empty-history">No call history yet</div>
                                    ) : (
                                        <div className="history-list">
                                            {callHistory.map(call => (
                                                <div key={call.id} className="history-item">
                                                    <div>
                                                        <span className="history-time">
                                                            {new Date(call.start).toLocaleTimeString()}
                                                        </span>
                                                        <span className="history-duration">{formatDuration(call.duration)}</span>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <span style={{
                                                            fontSize: '0.6875rem',
                                                            color: getScoreColor(call.score)
                                                        }}>
                                                            {call.score}%
                                                        </span>
                                                        {call.alertCount > 0 && (
                                                            <span className="badge badge-high" style={{ fontSize: '0.6rem' }}>
                                                                {call.alertCount} alert{call.alertCount !== 1 ? 's' : ''}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Transcript Area */}
                        <div className="transcript-area" ref={transcriptRef}>
                            {!isCallActive ? (
                                <div className="empty-state">
                                    <div className="empty-state-icon">
                                        <Phone size={24} />
                                    </div>
                                    <p className="empty-state-title">No active call</p>
                                    <p className="empty-state-desc">Click "Start Call" to begin monitoring</p>
                                </div>
                            ) : segments.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-state-icon pulse">
                                        <MessageSquare size={24} />
                                    </div>
                                    <p className="empty-state-title">Waiting for conversation...</p>
                                    <p className="empty-state-desc">Type messages below to simulate the conversation</p>
                                </div>
                            ) : (
                                <div className="messages-list">
                                    <AnimatePresence>
                                        {segments.map((segment, i) => {
                                            const hasAlert = alerts.some(a =>
                                                segment.text.toLowerCase().includes(a.evidence.quote.toLowerCase().substring(0, 20))
                                            );

                                            return (
                                                <motion.div
                                                    key={segment.id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className={`message-bubble ${segment.speaker} ${hasAlert ? 'has-alert' : ''}`}
                                                >
                                                    <div className="message-header">
                                                        {segment.speaker === 'agent' ? (
                                                            <User size={12} />
                                                        ) : (
                                                            <UserCircle size={12} />
                                                        )}
                                                        <span>{segment.speaker === 'agent' ? 'Agent' : 'Customer'}</span>
                                                        <span className="message-time">
                                                            {formatDuration(Math.floor(segment.timestamp_ms / 1000))}
                                                        </span>
                                                    </div>
                                                    <p>{segment.text}</p>
                                                    {hasAlert && (
                                                        <div className="message-alert-indicator">
                                                            <AlertTriangle size={10} />
                                                            Compliance issue detected
                                                        </div>
                                                    )}
                                                </motion.div>
                                            );
                                        })}
                                    </AnimatePresence>
                                </div>
                            )}
                        </div>

                        {/* Notes Panel */}
                        <AnimatePresence>
                            {showNotes && isCallActive && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="notes-panel"
                                >
                                    <label htmlFor="call-notes" style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>
                                        Call Notes
                                    </label>
                                    <textarea
                                        id="call-notes"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Add notes about this call..."
                                        className="notes-textarea"
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Input Area */}
                        {isCallActive && (
                            <div className="input-area">
                                <select
                                    value={speaker}
                                    onChange={(e) => setSpeaker(e.target.value as 'agent' | 'customer')}
                                    className="select"
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
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            addSegment();
                                        }
                                    }}
                                    placeholder="Type what was said... (Enter to add)"
                                    className="input-field"
                                    aria-label="Transcript input"
                                />
                                <button
                                    className="btn btn-primary"
                                    onClick={addSegment}
                                    disabled={!inputText.trim()}
                                >
                                    <Send size={14} />
                                    Add
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Sidebar */}
            <div className="agent-sidebar">
                {/* Alerts Card */}
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">
                            <div className="card-title-icon alert-icon">
                                <AlertTriangle size={16} />
                            </div>
                            <span>Compliance Alerts</span>
                            {alerts.length > 0 && (
                                <span className="badge badge-high">{alerts.length}</span>
                            )}
                        </div>
                    </div>

                    <div className="card-body" style={{ maxHeight: 300, overflowY: 'auto' }}>
                        {alerts.length === 0 ? (
                            <div className="empty-state small">
                                <Shield size={20} style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }} />
                                <p className="empty-state-desc">No alerts yet</p>
                                <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                                    Compliance issues will appear here as they're detected
                                </p>
                            </div>
                        ) : (
                            <div className="alerts-list">
                                <AnimatePresence>
                                    {alerts.map(alert => (
                                        <motion.div
                                            key={alert.id}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className={`alert-card ${alert.severity} ${expandedAlert === alert.id ? 'expanded' : ''}`}
                                            onClick={() => setExpandedAlert(expandedAlert === alert.id ? null : alert.id)}
                                        >
                                            <div className="alert-header">
                                                <div>
                                                    <h4>{alert.title}</h4>
                                                    <div className="alert-meta">
                                                        <span className={`badge badge-${alert.severity}`}>
                                                            {alert.severity}
                                                        </span>
                                                        <span className="alert-rule">{alert.rule_id}</span>
                                                        <span className="alert-confidence">{alert.confidence}%</span>
                                                    </div>
                                                </div>
                                                <ChevronRight
                                                    size={16}
                                                    style={{
                                                        transform: expandedAlert === alert.id ? 'rotate(90deg)' : 'none',
                                                        transition: 'transform 0.2s'
                                                    }}
                                                />
                                            </div>

                                            <div className="alert-evidence">
                                                "{alert.evidence.quote}"
                                            </div>

                                            <AnimatePresence>
                                                {expandedAlert === alert.id && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        className="alert-details"
                                                    >
                                                        <div className="alert-detail-item">
                                                            <strong>Why it matters:</strong>
                                                            <p>{alert.why_it_matters}</p>
                                                        </div>
                                                        <div className="alert-detail-item">
                                                            <strong>Suggested response:</strong>
                                                            <div className="suggestion-box">
                                                                <p>"{alert.agent_fix_suggestion}"</p>
                                                                <button
                                                                    className="btn-ghost"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        copyToClipboard(alert.agent_fix_suggestion, alert.id);
                                                                    }}
                                                                >
                                                                    {copiedId === alert.id ? <Check size={12} /> : <Copy size={12} />}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                </div>

                {/* Suggestions Card */}
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">
                            <div className="card-title-icon suggestion-icon">
                                <LightbulbIcon size={16} />
                            </div>
                            <span>What to Say Next</span>
                        </div>
                    </div>

                    <div className="card-body">
                        {suggestions.length === 0 ? (
                            <div className="empty-state small">
                                <MessageSquare size={20} style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }} />
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    Compliant response suggestions will appear here
                                </p>
                            </div>
                        ) : (
                            <div className="suggestions-list">
                                {suggestions.map((suggestion, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        className="suggestion-item"
                                    >
                                        <p>"{suggestion.text}"</p>
                                        <button
                                            className="btn-ghost"
                                            onClick={() => copyToClipboard(suggestion.text, `suggestion-${i}`)}
                                            aria-label="Copy suggestion"
                                        >
                                            {copiedId === `suggestion-${i}` ? (
                                                <Check size={14} />
                                            ) : (
                                                <Copy size={14} />
                                            )}
                                        </button>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
