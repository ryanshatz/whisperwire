import type { Alert, TranscriptSegment, CallMetadata, SuggestedLine, EvaluationResult } from '@/types';
import { tcpaRules, getEnabledRules, Rule } from './rules';

// State tracking for multi-turn detection
let dncRequested = false;
let consentRevoked = false;
let disclosuresMade = {
    seller_identified: false,
    sales_purpose_stated: false,
    product_described: false,
    callback_provided: false,
    recording_disclosed: false,
};
let seenAlertRules: Set<string> = new Set();

function generateId(): string {
    return `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function checkMetadataRule(metadata: CallMetadata, rule: Rule): Alert | null {
    switch (rule.id) {
        case 'TIME-001':
            // Would need actual time zone logic - skipping for now
            return null;

        case 'DNC-003':
            if (metadata.is_dnc_listed && !metadata.has_prior_consent) {
                return {
                    id: generateId(),
                    rule_id: rule.id,
                    title: rule.title,
                    severity: rule.severity as 'high' | 'medium' | 'low',
                    confidence: 95,
                    evidence: {
                        quote: 'Number flagged as DNC-listed in system metadata',
                        start_char: 0,
                        end_char: 0,
                    },
                    why_it_matters: rule.why_it_matters,
                    agent_fix_suggestion: rule.recommended_fix,
                };
            }
            return null;

        case 'PREC-001':
            if (metadata.is_prerecorded && !metadata.has_prior_consent) {
                return {
                    id: generateId(),
                    rule_id: rule.id,
                    title: rule.title,
                    severity: rule.severity as 'high' | 'medium' | 'low',
                    confidence: 95,
                    evidence: {
                        quote: 'Call flagged as using prerecorded voice without consent',
                        start_char: 0,
                        end_char: 0,
                    },
                    why_it_matters: rule.why_it_matters,
                    agent_fix_suggestion: rule.recommended_fix,
                };
            }
            return null;

        default:
            return null;
    }
}

function checkTriggers(transcript: string, transcriptLower: string, rule: Rule): Alert | null {
    for (const trigger of rule.triggers) {
        const triggerLower = trigger.toLowerCase();
        const pos = transcriptLower.indexOf(triggerLower);

        if (pos !== -1) {
            const endPos = pos + trigger.length;
            const contextEnd = Math.min(endPos + 30, transcript.length);
            const quote = transcript.substring(pos, contextEnd).trim();

            // DNC-001: Mark that DNC was requested
            if (rule.id === 'DNC-001') {
                dncRequested = true;
            }

            // DNC-002: Only trigger if DNC was already requested
            if (rule.id === 'DNC-002' && !dncRequested) {
                return null;
            }

            // CONS-001: Consent revocation
            if (rule.id === 'CONS-001') {
                consentRevoked = true;
            }

            return {
                id: generateId(),
                rule_id: rule.id,
                title: rule.title,
                severity: rule.severity as 'high' | 'medium' | 'low',
                confidence: 90,
                evidence: {
                    quote,
                    start_char: pos,
                    end_char: endPos,
                },
                why_it_matters: rule.why_it_matters,
                agent_fix_suggestion: rule.recommended_fix,
            };
        }
    }

    return null;
}

function checkRegexPatterns(transcript: string, transcriptLower: string, rule: Rule): Alert | null {
    for (const pattern of rule.regex_patterns) {
        try {
            const regex = new RegExp(pattern, 'i');
            const match = regex.exec(transcriptLower);

            if (match) {
                const start = match.index;
                const end = start + match[0].length;
                const contextEnd = Math.min(end + 30, transcript.length);
                const quote = transcript.substring(start, contextEnd).trim();

                // DNC-001: Mark that DNC was requested
                if (rule.id === 'DNC-001') {
                    dncRequested = true;
                }

                // DNC-002: Only trigger if DNC was already requested
                if (rule.id === 'DNC-002' && !dncRequested) {
                    return null;
                }

                // CONS-001: Consent revocation
                if (rule.id === 'CONS-001') {
                    consentRevoked = true;
                }

                // For disclosure rules, update state but don't alert (positive detection)
                if (rule.id === 'DISC-001') {
                    disclosuresMade.seller_identified = true;
                    return null;
                }
                if (rule.id === 'DISC-002') {
                    disclosuresMade.sales_purpose_stated = true;
                    return null;
                }
                if (rule.id === 'IDENT-001') {
                    disclosuresMade.callback_provided = true;
                    return null;
                }
                if (rule.id === 'REC-001') {
                    disclosuresMade.recording_disclosed = true;
                    return null;
                }

                return {
                    id: generateId(),
                    rule_id: rule.id,
                    title: rule.title,
                    severity: rule.severity as 'high' | 'medium' | 'low',
                    confidence: 85,
                    evidence: {
                        quote,
                        start_char: start,
                        end_char: end,
                    },
                    why_it_matters: rule.why_it_matters,
                    agent_fix_suggestion: rule.recommended_fix,
                };
            }
        } catch (e) {
            console.error(`Invalid regex pattern for rule ${rule.id}:`, e);
        }
    }

    return null;
}

export function evaluateTranscript(
    metadata: CallMetadata,
    segments: TranscriptSegment[],
    fullTranscript: string
): EvaluationResult {
    const alerts: Alert[] = [];
    const suggestions: SuggestedLine[] = [];

    const enabledRules = getEnabledRules();
    const transcriptLower = fullTranscript.toLowerCase();

    // Check each rule
    for (const rule of enabledRules) {
        // Skip if already alerted for this rule
        if (seenAlertRules.has(rule.id)) {
            continue;
        }

        let alert: Alert | null = null;

        // Check metadata-based rules first
        if (rule.requires_metadata) {
            alert = checkMetadataRule(metadata, rule);
        } else {
            // Check triggers first
            alert = checkTriggers(fullTranscript, transcriptLower, rule);

            // If no trigger match, check regex patterns
            if (!alert) {
                alert = checkRegexPatterns(fullTranscript, transcriptLower, rule);
            }
        }

        // Add alert if found
        if (alert) {
            alerts.push(alert);
            seenAlertRules.add(alert.rule_id);

            // Add suggestion based on alert
            if (rule.recommended_fix) {
                suggestions.push({
                    text: rule.recommended_fix,
                    confidence: 85,
                });
            }
        }
    }

    // Add contextual suggestions based on disclosure state
    if (metadata.call_type === 'outbound_sales' && fullTranscript.length > 50) {
        if (!disclosuresMade.seller_identified) {
            const existingSuggestion = suggestions.find(s => s.text.includes('Identify yourself'));
            if (!existingSuggestion) {
                suggestions.push({
                    text: 'Identify yourself and your company: "Hi, my name is [Name] calling from [Company Name]."',
                    confidence: 80,
                });
            }
        }

        if (!disclosuresMade.sales_purpose_stated && fullTranscript.length > 100) {
            const existingSuggestion = suggestions.find(s => s.text.includes('Disclose'));
            if (!existingSuggestion) {
                suggestions.push({
                    text: 'Disclose the sales purpose: "I\'m calling today with a special offer for you..."',
                    confidence: 80,
                });
            }
        }
    }

    return {
        alerts,
        suggested_next_lines: suggestions.slice(0, 3),
        evaluation_time_ms: 0,
    };
}

export function resetEvaluatorState(): void {
    dncRequested = false;
    consentRevoked = false;
    disclosuresMade = {
        seller_identified: false,
        sales_purpose_stated: false,
        product_described: false,
        callback_provided: false,
        recording_disclosed: false,
    };
    seenAlertRules.clear();
}
