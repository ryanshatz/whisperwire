'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BookOpen, Search, ChevronDown, ChevronRight,
    AlertTriangle, AlertCircle, Info, Clock, Phone,
    Shield, Mic, FileText, CheckCircle, XCircle, Zap
} from 'lucide-react';
import { tcpaRules, Rule } from '@/lib/rules';

const categoryInfo: Record<string, { icon: React.ElementType; label: string; color: string }> = {
    calling_time: { icon: Clock, label: 'Calling Time', color: '#0EA5E9' },
    do_not_call: { icon: Phone, label: 'Do Not Call', color: '#F43F5E' },
    disclosure: { icon: FileText, label: 'Disclosures', color: '#6366F1' },
    consent: { icon: Shield, label: 'Consent', color: '#F59E0B' },
    identification: { icon: FileText, label: 'Identification', color: '#71717A' },
    recording_disclosure: { icon: Mic, label: 'Recording Disclosure', color: '#0EA5E9' },
    prerecorded: { icon: Mic, label: 'Prerecorded Voice', color: '#F43F5E' },
};

export default function RulesView() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [expandedRules, setExpandedRules] = useState<Set<string>>(new Set());

    const filteredRules = tcpaRules.filter(rule => {
        const matchesSearch = searchQuery === '' ||
            rule.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            rule.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            rule.description.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesCategory = selectedCategory === null || rule.category === selectedCategory;

        return matchesSearch && matchesCategory;
    });

    const categories = [...new Set(tcpaRules.map(r => r.category))];

    const toggleRule = (ruleId: string) => {
        const newExpanded = new Set(expandedRules);
        if (newExpanded.has(ruleId)) {
            newExpanded.delete(ruleId);
        } else {
            newExpanded.add(ruleId);
        }
        setExpandedRules(newExpanded);
    };

    const severityIcon = {
        high: AlertTriangle,
        medium: AlertCircle,
        low: Info,
    };

    return (
        <div className="animate-fadeIn" style={{ paddingBottom: '4rem' }}>
            {/* Header Card */}
            <motion.div
                className="card"
                style={{ marginBottom: '1.5rem' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="card-body">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                        <div style={{
                            width: 44, height: 44, borderRadius: 12,
                            background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <BookOpen size={22} color="white" />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                TCPA Compliance Rule Library
                            </h2>
                            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                                Version 1.0.0 • {tcpaRules.length} rules defined
                            </p>
                        </div>
                    </div>

                    {/* Legal Disclaimer */}
                    <div style={{
                        padding: '0.875rem 1rem',
                        borderRadius: 10,
                        background: 'var(--severity-medium-bg)',
                        border: '1px solid var(--severity-medium-border)',
                        marginBottom: '1.25rem',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.75rem'
                    }}>
                        <AlertTriangle size={16} style={{ color: 'var(--severity-medium)', flexShrink: 0, marginTop: 2 }} />
                        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                            <strong style={{ color: 'var(--severity-medium)' }}>Legal Disclaimer:</strong> This rule library provides compliance risk signals only.
                            It is NOT legal advice. Compliance requirements depend on jurisdiction and require legal counsel review.
                        </p>
                    </div>

                    {/* Search and Filters */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                        <div style={{ flex: '1 1 300px', position: 'relative' }}>
                            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                placeholder="Search rules by ID, title, or description..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="input-field"
                                style={{ paddingLeft: 40 }}
                                aria-label="Search rules"
                            />
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                            <button
                                onClick={() => setSelectedCategory(null)}
                                className={`btn ${selectedCategory === null ? 'btn-primary' : 'btn-secondary'}`}
                                style={{ padding: '0.5rem 0.875rem' }}
                            >
                                All
                            </button>
                            {categories.map(category => {
                                const info = categoryInfo[category];
                                const Icon = info?.icon || FileText;
                                return (
                                    <button
                                        key={category}
                                        onClick={() => setSelectedCategory(category)}
                                        className={`btn ${selectedCategory === category ? 'btn-primary' : 'btn-secondary'}`}
                                        style={{ padding: '0.5rem 0.875rem' }}
                                    >
                                        <Icon size={12} />
                                        {info?.label || category}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Rules List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <AnimatePresence>
                    {filteredRules.map((rule, index) => {
                        const isExpanded = expandedRules.has(rule.id);
                        const SeverityIcon = severityIcon[rule.severity];
                        const catInfo = categoryInfo[rule.category];
                        const CategoryIcon = catInfo?.icon || FileText;

                        return (
                            <motion.div
                                key={rule.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ delay: index * 0.03 }}
                                className="card"
                                style={{ overflow: 'hidden' }}
                            >
                                {/* Rule Header */}
                                <button
                                    onClick={() => toggleRule(rule.id)}
                                    style={{
                                        width: '100%',
                                        padding: '1rem 1.25rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1rem',
                                        textAlign: 'left',
                                        background: 'transparent',
                                        border: 'none',
                                        cursor: 'pointer',
                                        transition: 'background 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    aria-expanded={isExpanded}
                                >
                                    <motion.div
                                        animate={{ rotate: isExpanded ? 90 : 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
                                    </motion.div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{
                                            fontFamily: 'monospace',
                                            fontSize: '0.75rem',
                                            background: 'var(--bg-elevated)',
                                            padding: '0.25rem 0.5rem',
                                            borderRadius: 6,
                                            color: 'var(--text-secondary)'
                                        }}>
                                            {rule.id}
                                        </span>
                                        <span className={`badge badge-${rule.severity}`}>
                                            <SeverityIcon size={10} />
                                            {rule.severity}
                                        </span>
                                        {rule.optional && (
                                            <span style={{
                                                fontSize: '0.6875rem',
                                                padding: '0.1875rem 0.5rem',
                                                background: 'var(--bg-elevated)',
                                                borderRadius: 6,
                                                color: 'var(--text-muted)'
                                            }}>
                                                Optional
                                            </span>
                                        )}
                                    </div>

                                    <div style={{ flex: 1 }}>
                                        <h3 style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
                                            {rule.title}
                                        </h3>
                                        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                                            {rule.description}
                                        </p>
                                    </div>

                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        padding: '0.375rem 0.75rem',
                                        borderRadius: 20,
                                        background: `${catInfo?.color}20`
                                    }}>
                                        <CategoryIcon size={12} style={{ color: catInfo?.color }} />
                                        <span style={{ fontSize: '0.6875rem', fontWeight: 500, color: catInfo?.color }}>
                                            {catInfo?.label}
                                        </span>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                        {rule.enabled ? (
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--severity-low)' }}>
                                                <CheckCircle size={14} />
                                                <span style={{ fontSize: '0.6875rem' }}>Enabled</span>
                                            </span>
                                        ) : (
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-muted)' }}>
                                                <XCircle size={14} />
                                                <span style={{ fontSize: '0.6875rem' }}>Disabled</span>
                                            </span>
                                        )}
                                    </div>
                                </button>

                                {/* Expanded Content */}
                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            style={{ borderTop: '1px solid var(--border)', overflow: 'hidden' }}
                                        >
                                            <div style={{ padding: '1.25rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                                                <div>
                                                    <h4 style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                                                        Why This Matters
                                                    </h4>
                                                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                                        {rule.why_it_matters}
                                                    </p>
                                                </div>

                                                <div>
                                                    <h4 style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                                                        Recommended Response
                                                    </h4>
                                                    <div style={{
                                                        padding: 1,
                                                        borderRadius: 10,
                                                        background: 'linear-gradient(135deg, var(--primary), var(--accent))'
                                                    }}>
                                                        <div style={{
                                                            background: 'var(--bg-surface)',
                                                            borderRadius: 9,
                                                            padding: '0.75rem 1rem'
                                                        }}>
                                                            <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontStyle: 'italic' }}>
                                                                "{rule.recommended_fix}"
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {rule.triggers.length > 0 && (
                                                    <div>
                                                        <h4 style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                                                            Trigger Phrases
                                                        </h4>
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                                                            {rule.triggers.map((trigger, i) => (
                                                                <span
                                                                    key={i}
                                                                    style={{
                                                                        fontSize: '0.75rem',
                                                                        padding: '0.25rem 0.625rem',
                                                                        borderRadius: 6,
                                                                        background: 'var(--bg-elevated)',
                                                                        color: 'var(--text-secondary)'
                                                                    }}
                                                                >
                                                                    {trigger}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                <div>
                                                    <h4 style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                                                        Legal Reference
                                                    </h4>
                                                    <p style={{ fontSize: '0.8125rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                                                        {rule.legal_reference}
                                                    </p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {/* Empty State */}
            {filteredRules.length === 0 && (
                <div className="empty-state" style={{ padding: '4rem 1.5rem' }}>
                    <div className="empty-state-icon">
                        <Search size={24} />
                    </div>
                    <p className="empty-state-title">No rules match your search</p>
                    <p className="empty-state-desc">
                        Try adjusting your filters or search terms
                    </p>
                </div>
            )}
        </div>
    );
}
