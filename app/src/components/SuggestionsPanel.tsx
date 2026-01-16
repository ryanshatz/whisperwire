'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, Copy, Check, Sparkles } from 'lucide-react';
import { SuggestedLine } from '@/types';
import toast from 'react-hot-toast';

interface SuggestionsPanelProps {
    suggestions: SuggestedLine[];
}

export default function SuggestionsPanel({ suggestions }: SuggestionsPanelProps) {
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    const handleCopy = async (text: string, index: number) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedIndex(index);
            toast.success('Copied to clipboard!');
            setTimeout(() => setCopiedIndex(null), 2000);
        } catch (err) {
            toast.error('Failed to copy');
        }
    };

    return (
        <motion.div
            className="glass-card p-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
        >
            <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)]">
                    <Lightbulb className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                    What to Say Next
                </h2>
            </div>

            <p className="text-sm text-[var(--text-muted)] mb-4">
                Compliant phrasing suggestions based on the current conversation context.
            </p>

            <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                    {suggestions.length === 0 ? (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="empty-state py-6"
                        >
                            <Sparkles className="w-10 h-10 text-[var(--text-muted)] mb-2" />
                            <p className="text-[var(--text-muted)]">No suggestions yet</p>
                            <p className="text-xs text-[var(--text-muted)]">
                                Suggestions will appear as the call progresses
                            </p>
                        </motion.div>
                    ) : (
                        suggestions.map((suggestion, index) => (
                            <motion.div
                                key={`${suggestion.text.slice(0, 20)}-${index}`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ delay: index * 0.1 }}
                                className="group"
                            >
                                <div className="relative p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--primary)] transition-all duration-300 hover:shadow-[0_0_20px_rgba(79,70,229,0.1)]">
                                    {/* Confidence Badge */}
                                    <div className="absolute top-3 right-3">
                                        <span className="text-xs font-medium text-[var(--text-muted)] bg-[var(--surface-elevated)] px-2 py-1 rounded-full">
                                            {suggestion.confidence}% match
                                        </span>
                                    </div>

                                    {/* Suggestion Text */}
                                    <p className="text-sm text-[var(--text-primary)] pr-20 leading-relaxed">
                                        {suggestion.text}
                                    </p>

                                    {/* Copy Button */}
                                    <div className="mt-3 flex justify-end">
                                        <button
                                            onClick={() => handleCopy(suggestion.text, index)}
                                            className={`copy-btn ${copiedIndex === index ? 'copied' : ''}`}
                                            aria-label="Copy suggestion"
                                        >
                                            {copiedIndex === index ? (
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

                                    {/* Decorative gradient line */}
                                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--primary)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-b-xl" />
                                </div>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
