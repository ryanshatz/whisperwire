'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { User, Headphones, AlertCircle } from 'lucide-react';
import { TranscriptSegment, Alert } from '@/types';
import { useRef, useEffect } from 'react';

interface TranscriptPanelProps {
    segments: TranscriptSegment[];
    alerts: Alert[];
    selectedAlertId: string | null;
    onAlertClick: (alertId: string | null) => void;
}

export default function TranscriptPanel({
    segments,
    alerts,
    selectedAlertId,
    onAlertClick
}: TranscriptPanelProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when new segments arrive
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [segments]);

    // Find alerts that apply to a specific character range
    const getAlertsForSegment = (segment: TranscriptSegment): Alert[] => {
        return alerts.filter(alert => {
            const alertStart = alert.evidence.start_char;
            const alertEnd = alert.evidence.end_char;
            return alertStart >= segment.start_char && alertEnd <= segment.end_char;
        });
    };

    // Highlight text with alert markers
    const highlightText = (segment: TranscriptSegment): React.ReactNode => {
        const segmentAlerts = getAlertsForSegment(segment);

        if (segmentAlerts.length === 0) {
            return segment.text;
        }

        // For simplicity, we'll highlight the entire segment if it contains an alert trigger
        const highestSeverity = segmentAlerts.reduce((highest, alert) => {
            const severityOrder = { high: 3, medium: 2, low: 1 };
            return severityOrder[alert.severity] > severityOrder[highest] ? alert.severity : highest;
        }, 'low' as 'high' | 'medium' | 'low');

        const highlightClass = {
            high: 'transcript-highlight',
            medium: 'transcript-highlight transcript-highlight-medium',
            low: 'transcript-highlight transcript-highlight-low',
        }[highestSeverity];

        return (
            <span
                className={`${highlightClass} cursor-pointer`}
                onClick={() => onAlertClick(segmentAlerts[0]?.id || null)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        onAlertClick(segmentAlerts[0]?.id || null);
                    }
                }}
                aria-label={`Alert: ${segmentAlerts[0]?.title}`}
            >
                {segment.text}
                <AlertCircle className="inline w-4 h-4 ml-1 text-[var(--severity-high)]" />
            </span>
        );
    };

    return (
        <motion.div
            className="glass-card p-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
        >
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                    Live Transcript
                </h2>
                <div className="flex items-center gap-2">
                    {segments.length > 0 && (
                        <div className="flex items-center gap-1 text-sm text-[var(--text-muted)]">
                            <div className="live-dot" />
                            <span>Live</span>
                        </div>
                    )}
                </div>
            </div>

            <div
                ref={scrollRef}
                className="h-[500px] overflow-y-auto space-y-4 pr-2"
                role="log"
                aria-label="Call transcript"
                aria-live="polite"
            >
                <AnimatePresence>
                    {segments.length === 0 ? (
                        <div className="empty-state py-12">
                            <Headphones className="w-16 h-16 text-[var(--text-muted)] mb-4" />
                            <p className="text-[var(--text-secondary)]">Waiting for call to start...</p>
                            <p className="text-sm text-[var(--text-muted)]">
                                Click "Play Demo" to begin the simulation
                            </p>
                        </div>
                    ) : (
                        segments.map((segment, index) => (
                            <motion.div
                                key={`${segment.start_time_ms}-${index}`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                                className={`flex gap-3 ${segment.speaker === 'agent' ? 'flex-row' : 'flex-row-reverse'
                                    }`}
                            >
                                {/* Avatar */}
                                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${segment.speaker === 'agent'
                                        ? 'bg-[var(--primary)] bg-opacity-20'
                                        : 'bg-[var(--secondary)] bg-opacity-20'
                                    }`}>
                                    {segment.speaker === 'agent' ? (
                                        <Headphones className="w-4 h-4 text-[var(--primary)]" />
                                    ) : (
                                        <User className="w-4 h-4 text-[var(--secondary)]" />
                                    )}
                                </div>

                                {/* Message Bubble */}
                                <div className={`flex-1 max-w-[80%] ${segment.speaker === 'agent' ? '' : 'text-right'
                                    }`}>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-xs font-medium ${segment.speaker === 'agent'
                                                ? 'text-[var(--primary)]'
                                                : 'text-[var(--secondary)]'
                                            }`}>
                                            {segment.speaker === 'agent' ? 'Agent' : 'Customer'}
                                        </span>
                                        <span className="text-xs text-[var(--text-muted)]">
                                            {formatTime(segment.start_time_ms)}
                                        </span>
                                    </div>
                                    <div className={`inline-block px-4 py-2 rounded-2xl ${segment.speaker === 'agent'
                                            ? 'bg-[var(--surface-elevated)] text-[var(--text-primary)] rounded-tl-sm'
                                            : 'bg-[var(--primary)] bg-opacity-10 text-[var(--text-primary)] rounded-tr-sm'
                                        }`}>
                                        <p className="text-sm leading-relaxed">
                                            {highlightText(segment)}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}

function formatTime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}
