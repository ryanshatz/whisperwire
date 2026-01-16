'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    BarChart3, Download, Phone, AlertTriangle,
    TrendingUp, TrendingDown, Users, FileJson,
    FileSpreadsheet, Calendar, Filter
} from 'lucide-react';
import { mockAlerts, mockAnalytics } from '@/lib/mock-data';
import toast from 'react-hot-toast';

export default function AdminView() {
    const [dateRange, setDateRange] = useState('7d');
    const [severityFilter, setSeverityFilter] = useState('all');
    const [agentFilter, setAgentFilter] = useState('all');

    const analytics = mockAnalytics;
    const alerts = mockAlerts.filter(alert => {
        if (severityFilter !== 'all' && alert.severity !== severityFilter) return false;
        if (agentFilter !== 'all' && alert.agent_id !== agentFilter) return false;
        return true;
    });

    const handleExportJson = () => {
        const dataStr = JSON.stringify(alerts, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `whisperwire-alerts-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        toast.success('Exported alerts to JSON');
    };

    const handleExportCsv = () => {
        const headers = ['ID', 'Call ID', 'Agent', 'Rule ID', 'Title', 'Severity', 'Confidence', 'Quote', 'Created At'];
        const rows = alerts.map(a => [
            a.id, a.call_id, a.agent_name, a.rule_id, a.title, a.severity, a.confidence, `"${a.evidence.quote}"`, a.created_at
        ]);
        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `whisperwire-alerts-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        toast.success('Exported alerts to CSV');
    };

    const stats = [
        {
            label: 'Total Calls Monitored',
            value: analytics.total_calls,
            icon: Phone,
            iconColor: 'var(--primary)',
            iconBg: 'rgba(99, 102, 241, 0.15)',
            trend: '+12%',
            trendPositive: true,
        },
        {
            label: 'Total Alerts',
            value: analytics.total_alerts,
            icon: AlertTriangle,
            iconColor: 'var(--severity-high)',
            iconBg: 'var(--severity-high-bg)',
            trend: '-8%',
            trendPositive: true,
        },
        {
            label: 'Alert Rate',
            value: `${((analytics.total_alerts / analytics.total_calls) * 100).toFixed(1)}%`,
            icon: TrendingUp,
            iconColor: 'var(--secondary)',
            iconBg: 'rgba(14, 165, 233, 0.15)',
            trend: '-3%',
            trendPositive: true,
        },
        {
            label: 'Active Agents',
            value: analytics.alerts_by_agent.length,
            icon: Users,
            iconColor: 'var(--accent)',
            iconBg: 'rgba(139, 92, 246, 0.15)',
        },
    ];

    return (
        <div className="animate-fadeIn" style={{ paddingBottom: '4rem' }}>
            {/* Stats Grid */}
            <div className="stats-grid">
                {stats.map((stat, i) => {
                    const Icon = stat.icon;
                    const TrendIcon = stat.trendPositive ? TrendDown : TrendUp;

                    return (
                        <motion.div
                            key={stat.label}
                            className="stat-card"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                        >
                            <div className="stat-header">
                                <div className="stat-icon" style={{ background: stat.iconBg }}>
                                    <Icon size={18} style={{ color: stat.iconColor }} />
                                </div>
                                {stat.trend && (
                                    <span className={`stat-trend ${stat.trendPositive ? 'positive' : 'negative'}`}>
                                        {stat.trend}
                                    </span>
                                )}
                            </div>
                            <div className="stat-value">{stat.value}</div>
                            <div className="stat-label">{stat.label}</div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Severity Breakdown */}
            <motion.div
                className="card"
                style={{ marginBottom: '1.5rem' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
            >
                <div className="card-header">
                    <div className="card-title">
                        <div className="card-title-icon" style={{ background: 'var(--severity-high-bg)', color: 'var(--severity-high)' }}>
                            <BarChart3 size={16} />
                        </div>
                        <span>Alerts by Severity</span>
                    </div>
                </div>
                <div className="card-body">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                        {[
                            { key: 'high', label: 'High Severity', color: 'var(--severity-high)', bg: 'var(--severity-high-bg)', border: 'var(--severity-high-border)', count: analytics.alerts_by_severity.high },
                            { key: 'medium', label: 'Medium Severity', color: 'var(--severity-medium)', bg: 'var(--severity-medium-bg)', border: 'var(--severity-medium-border)', count: analytics.alerts_by_severity.medium },
                            { key: 'low', label: 'Low Severity', color: 'var(--severity-low)', bg: 'var(--severity-low-bg)', border: 'var(--severity-low-border)', count: analytics.alerts_by_severity.low },
                        ].map(sev => (
                            <div
                                key={sev.key}
                                style={{
                                    padding: '1rem 1.25rem',
                                    borderRadius: 12,
                                    background: sev.bg,
                                    border: `1px solid ${sev.border}`
                                }}
                            >
                                <div style={{ fontSize: '2rem', fontWeight: 700, color: sev.color, marginBottom: '0.25rem' }}>
                                    {sev.count}
                                </div>
                                <div style={{ fontSize: '0.8125rem', color: sev.color }}>
                                    {sev.label}
                                </div>
                                <div style={{
                                    marginTop: '0.75rem',
                                    height: 6,
                                    background: 'rgba(255,255,255,0.1)',
                                    borderRadius: 3,
                                    overflow: 'hidden'
                                }}>
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(sev.count / analytics.total_alerts) * 100}%` }}
                                        transition={{ delay: 0.6, duration: 0.5 }}
                                        style={{ height: '100%', background: sev.color, borderRadius: 3 }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </motion.div>

            {/* Most Common Rules */}
            <motion.div
                className="card"
                style={{ marginBottom: '1.5rem' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
            >
                <div className="card-header">
                    <div className="card-title">
                        <div className="card-title-icon" style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))', color: 'white' }}>
                            <TrendingUp size={16} />
                        </div>
                        <span>Most Common Rules Triggered</span>
                    </div>
                </div>
                <div className="card-body">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {analytics.alerts_by_rule.slice(0, 5).map((item, index) => (
                            <div key={item.rule_id} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <span style={{
                                    fontFamily: 'monospace',
                                    fontSize: '0.75rem',
                                    color: 'var(--text-muted)',
                                    width: 80
                                }}>
                                    {item.rule_id}
                                </span>
                                <div style={{
                                    flex: 1,
                                    height: 24,
                                    background: 'var(--bg-elevated)',
                                    borderRadius: 6,
                                    overflow: 'hidden'
                                }}>
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(item.count / analytics.alerts_by_rule[0].count) * 100}%` }}
                                        transition={{ delay: 0.7 + index * 0.1, duration: 0.5 }}
                                        style={{
                                            height: '100%',
                                            background: 'linear-gradient(90deg, var(--primary), var(--accent))',
                                            borderRadius: 6
                                        }}
                                    />
                                </div>
                                <span style={{
                                    fontSize: '0.875rem',
                                    fontWeight: 600,
                                    color: 'var(--text-primary)',
                                    width: 40,
                                    textAlign: 'right'
                                }}>
                                    {item.count}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </motion.div>

            {/* Alerts Log */}
            <motion.div
                className="card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
            >
                <div className="card-header">
                    <div className="card-title">
                        <div className="card-title-icon" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                            <Filter size={16} />
                        </div>
                        <span>Alerts Log</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <select
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            className="select"
                            aria-label="Date range filter"
                        >
                            <option value="1d">Last 24 hours</option>
                            <option value="7d">Last 7 days</option>
                            <option value="30d">Last 30 days</option>
                            <option value="90d">Last 90 days</option>
                        </select>

                        <select
                            value={severityFilter}
                            onChange={(e) => setSeverityFilter(e.target.value)}
                            className="select"
                            aria-label="Severity filter"
                        >
                            <option value="all">All Severities</option>
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                        </select>

                        <select
                            value={agentFilter}
                            onChange={(e) => setAgentFilter(e.target.value)}
                            className="select"
                            aria-label="Agent filter"
                        >
                            <option value="all">All Agents</option>
                            {analytics.alerts_by_agent.map(agent => (
                                <option key={agent.agent_id} value={agent.agent_id}>
                                    {agent.agent_name}
                                </option>
                            ))}
                        </select>

                        <button onClick={handleExportJson} className="btn btn-secondary">
                            <FileJson size={14} />
                            JSON
                        </button>
                        <button onClick={handleExportCsv} className="btn btn-secondary">
                            <FileSpreadsheet size={14} />
                            CSV
                        </button>
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Timestamp</th>
                                <th>Agent</th>
                                <th>Rule</th>
                                <th>Title</th>
                                <th>Severity</th>
                                <th>Confidence</th>
                                <th>Evidence</th>
                            </tr>
                        </thead>
                        <tbody>
                            {alerts.slice(0, 10).map((alert) => (
                                <tr key={alert.id}>
                                    <td style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                                        {new Date(alert.created_at).toLocaleString()}
                                    </td>
                                    <td>{alert.agent_name}</td>
                                    <td>
                                        <span style={{
                                            fontFamily: 'monospace',
                                            fontSize: '0.6875rem',
                                            background: 'var(--bg-elevated)',
                                            padding: '0.25rem 0.5rem',
                                            borderRadius: 4
                                        }}>
                                            {alert.rule_id}
                                        </span>
                                    </td>
                                    <td>{alert.title}</td>
                                    <td>
                                        <span className={`badge badge-${alert.severity}`}>
                                            {alert.severity}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <div style={{ width: 48, height: 4, background: 'var(--bg-elevated)', borderRadius: 2, overflow: 'hidden' }}>
                                                <div style={{ width: `${alert.confidence}%`, height: '100%', background: 'var(--primary)' }} />
                                            </div>
                                            <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>{alert.confidence}%</span>
                                        </div>
                                    </td>
                                    <td style={{ maxWidth: 200, color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.75rem' }}>
                                        "{alert.evidence.quote.substring(0, 50)}..."
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </div>
    );
}

// Helper for trend icon
function TrendDown({ size, ...props }: { size: number }) {
    return <TrendingDown size={size} {...props} />;
}

function TrendUp({ size, ...props }: { size: number }) {
    return <TrendingUp size={size} {...props} />;
}
