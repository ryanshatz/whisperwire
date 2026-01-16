'use client';

import { motion } from 'framer-motion';
import { Shield, Zap, Phone } from 'lucide-react';

export default function Header() {
    return (
        <header className="px-6 py-4 border-b border-[var(--border)] bg-[var(--surface)]">
            <div className="max-w-[1800px] mx-auto flex items-center justify-between">
                {/* Logo and Brand */}
                <motion.div
                    className="flex items-center gap-3"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="relative">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center">
                            <Shield className="w-5 h-5 text-white" />
                        </div>
                        <motion.div
                            className="absolute -top-1 -right-1 w-3 h-3 bg-[var(--severity-low)] rounded-full border-2 border-[var(--surface)]"
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold gradient-text">Whisperwire</h1>
                        <p className="text-xs text-[var(--text-muted)]">TCPA Compliance Copilot</p>
                    </div>
                </motion.div>

                {/* Live Status Indicator */}
                <motion.div
                    className="flex items-center gap-6"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--surface-elevated)] border border-[var(--border)]">
                        <Phone className="w-4 h-4 text-[var(--text-muted)]" />
                        <span className="text-sm text-[var(--text-secondary)]">Demo Mode</span>
                    </div>

                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--severity-low-bg)] border border-[rgba(16,185,129,0.3)]">
                        <div className="live-dot" />
                        <span className="text-sm font-medium text-[var(--severity-low)]">System Active</span>
                    </div>

                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--surface-elevated)] border border-[var(--border)]">
                        <Zap className="w-4 h-4 text-[var(--secondary)]" />
                        <span className="text-sm text-[var(--text-secondary)]">Rules-based Mode</span>
                    </div>
                </motion.div>
            </div>
        </header>
    );
}
