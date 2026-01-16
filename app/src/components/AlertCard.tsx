'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    AlertTriangle,
    AlertCircle,
    Info,
    Copy,
    Check,
    ChevronDown,
    ChevronUp,
    ExternalLink
} from 'lucide-react';
import { Alert } from '@/types';
import toast from 'react-hot-toast';

interface AlertCardProps {
    alert: Alert;
    isSelected?: boolean;
    onClick?: () => void;
}

export default function AlertCard({ alert, isSelected, onClick }: AlertCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [copied, setCopied] = useState(false);

    const severityConfig = {
        high: {
            icon: AlertTriangle,
            badge: 'badge-high',
            border: 'border-l-[var(--severity-high)]',
            glow: 'hover:shadow-[0_0_20px_rgba(239,68,68,0.2)]',
        },
        medium: {
            icon: AlertCircle,
            badge: 'badge-medium',
            border: 'border-l-[var(--severity-medium)]',
            glow: 'hover:shadow-[0_0_20px_rgba(245,158,11,0.2)]',
        },
        low: {
            icon: Info,
            badge: 'badge-low',
            border: 'border-l-[var(--severity-low)]',
            glow: 'hover:shadow-[0_0_20px_rgba(16,185,129,0.2)]',
        },
    };

    const config = severityConfig[alert.severity];
    const Icon = config.icon;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(alert.agent_fix_suggestion);
            setCopied(true);
            toast.success('Copied to clipboard!');
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            toast.error('Failed to copy');
        }
    };

    return (
        <motion.div
            className={`
        bg-[var(--surface)] rounded-xl border-l-4 ${config.border} 
        transition-all duration-300 cursor-pointer
        ${config.glow}
        ${isSelected ? 'ring-2 ring-[var(--primary)]' : ''}
      `}
            onClick={onClick}
            whileHover={{ scale: 1.01 }}
            layout
        >
            <div className="p-4">
                {/* Header */}
                <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <Icon className={`w-5 h-5 ${alert.severity === 'high' ? 'text-[var(--severity-high)]' :
                                alert.severity === 'medium' ? 'text-[var(--severity-medium)]' :
                                    'text-[var(--severity-low)]'
                            }`} />
                        <h3 className="font-semibold text-[var(--text-primary)]">
                            {alert.title}
                        </h3>
                    </div>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsExpanded(!isExpanded);
                        }}
                        className="p-1 rounded-lg hover:bg-[var(--surface-elevated)] transition-colors"
                        aria-label={isExpanded ? 'Collapse' : 'Expand'}
                    >
                        {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" />
                        ) : (
                            <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
                        )}
                    </button>
                </div>

                {/* Badges */}
                <div className="flex items-center gap-2 mb-3">
                    <span className={`badge ${config.badge}`}>
                        {alert.severity}
                    </span>
                    <span className="badge bg-[var(--surface-elevated)] text-[var(--text-secondary)] border border-[var(--border)]">
                        {alert.rule_id}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                        <span className="font-medium">{alert.confidence}%</span>
                        <span>confidence</span>
                    </div>
                </div>

                {/* Evidence Quote */}
                <div className="bg-[var(--surface-elevated)] rounded-lg p-3 mb-3 border-l-2 border-[var(--border)]">
                    <p className="text-sm italic text-[var(--text-secondary)]">
                        "{alert.evidence.quote}"
                    </p>
                </div>

                {/* Expanded Content */}
                <motion.div
                    initial={false}
                    animate={{ height: isExpanded ? 'auto' : 0, opacity: isExpanded ? 1 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                >
                    <div className="pt-3 border-t border-[var(--border)] space-y-4">
                        {/* Why It Matters */}
                        <div>
                            <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1">
                                Why This Matters
                            </h4>
                            <p className="text-sm text-[var(--text-secondary)]">
                                {alert.why_it_matters}
                            </p>
                        </div>

                        {/* Suggested Fix */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">
                                    Suggested Response
                                </h4>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleCopy();
                                    }}
                                    className={`copy-btn ${copied ? 'copied' : ''}`}
                                    aria-label="Copy suggested response"
                                >
                                    {copied ? (
                                        <>
                                            <Check className="w-3 h-3" />
                                            Copied!
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-3 h-3" />
                                            Copy
                                        </>
                                    )}
                                </button>
                            </div>
                            <div className="bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] p-[1px] rounded-lg">
                                <div className="bg-[var(--surface)] rounded-lg p-3">
                                    <p className="text-sm text-[var(--text-primary)]">
                                        {alert.agent_fix_suggestion}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Confidence Meter */}
                <div className="mt-3">
                    <div className="confidence-meter">
                        <motion.div
                            className="confidence-fill"
                            style={{
                                background: `linear-gradient(90deg, 
                  ${alert.severity === 'high' ? 'var(--severity-high)' :
                                        alert.severity === 'medium' ? 'var(--severity-medium)' :
                                            'var(--severity-low)'} 0%, 
                  transparent 100%)`
                            }}
                            initial={{ width: 0 }}
                            animate={{ width: `${alert.confidence}%` }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        />
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
