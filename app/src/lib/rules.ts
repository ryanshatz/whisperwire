export interface Rule {
    id: string;
    title: string;
    category: string;
    description: string;
    severity: 'high' | 'medium' | 'low';
    triggers: string[];
    regex_patterns: string[];
    requires_metadata: boolean;
    metadata_field?: string;
    why_it_matters: string;
    recommended_fix: string;
    legal_reference: string;
    enabled: boolean;
    optional: boolean;
}

export const tcpaRules: Rule[] = [
    // Calling Time Rules
    {
        id: 'TIME-001',
        title: 'Calling Time Violation',
        category: 'calling_time',
        description: 'Telemarketing calls made outside 8am-9pm in the consumer\'s local time',
        severity: 'high',
        triggers: [],
        regex_patterns: [],
        requires_metadata: true,
        metadata_field: 'call_time_local',
        why_it_matters: 'The TCPA prohibits telemarketing calls before 8am or after 9pm in the consumer\'s local time zone. Violations can result in $500-$1,500 per call.',
        recommended_fix: 'Verify time zone before calling. If outside hours, apologize and offer to call back during appropriate hours.',
        legal_reference: '47 U.S.C. § 227(c)(5); 47 C.F.R. § 64.1200(c)(1)',
        enabled: true,
        optional: false,
    },

    // Do Not Call Rules
    {
        id: 'DNC-001',
        title: 'Customer Requested No Further Calls',
        category: 'do_not_call',
        description: 'Customer explicitly requests to stop receiving calls',
        severity: 'high',
        triggers: [
            'don\'t call me',
            'do not call me',
            'stop calling me',
            'remove me from your list',
            'take me off your list',
            'put me on do not call',
            'add me to do not call',
            'no more calls',
            'never call again',
            'stop contacting me',
        ],
        regex_patterns: [
            '(?:don\'?t|do\\s*not|stop|quit|cease)\\s+(?:call|contact|ring|phone)',
            '(?:remove|take)\\s+(?:me|my\\s+number)\\s+(?:from|off)',
            '(?:put|add)\\s+(?:me|my\\s+number)\\s+(?:on|to)\\s+(?:the\\s+)?(?:do\\s*not\\s*call|dnc)',
        ],
        requires_metadata: false,
        why_it_matters: 'Under TCPA, consumers can revoke consent by any reasonable means at any time. Continuing to call after a DNC request is a violation.',
        recommended_fix: 'Understood—I\'ll add you to our Do Not Call list effective immediately. You won\'t receive any more marketing calls from us. Is there anything else I can help you with today?',
        legal_reference: '47 U.S.C. § 227(c); 47 C.F.R. § 64.1200(d)',
        enabled: true,
        optional: false,
    },
    {
        id: 'DNC-002',
        title: 'Agent Continued After DNC Request',
        category: 'do_not_call',
        description: 'Agent attempted to continue sales pitch after customer requested DNC',
        severity: 'high',
        triggers: [
            'before you go',
            'just one more thing',
            'let me just tell you',
            'you might want to hear',
            'are you sure',
            'but wait',
        ],
        regex_patterns: [
            '(?:before\\s+you\\s+go|just\\s+one\\s+more|let\\s+me\\s+just)',
            '(?:are\\s+you\\s+sure|but\\s+wait|hear\\s+me\\s+out)',
        ],
        requires_metadata: false,
        why_it_matters: 'After a DNC request, any attempt to continue selling significantly increases violation risk and demonstrates willful non-compliance.',
        recommended_fix: 'Do not continue selling. Acknowledge the request, confirm DNC placement, and end the call professionally.',
        legal_reference: '47 C.F.R. § 64.1200(d)(3)',
        enabled: true,
        optional: false,
    },
    {
        id: 'DNC-003',
        title: 'National DNC List - No Consent Evidence',
        category: 'do_not_call',
        description: 'Number is on National DNC list and call is marketing without consent evidence',
        severity: 'high',
        triggers: [],
        regex_patterns: [],
        requires_metadata: true,
        metadata_field: 'is_dnc_listed',
        why_it_matters: 'Calling numbers on the National DNC Registry without prior express consent or an established business relationship is a TCPA violation.',
        recommended_fix: 'If calling a DNC-listed number, ensure you have documented consent or an existing business relationship. If unsure, end the marketing call.',
        legal_reference: '47 C.F.R. § 64.1200(c)(2)',
        enabled: true,
        optional: false,
    },

    // Disclosure Rules
    {
        id: 'DISC-001',
        title: 'Missing Seller Identity Disclosure',
        category: 'disclosure',
        description: 'Agent did not promptly identify the seller/company name',
        severity: 'medium',
        triggers: [],
        regex_patterns: [
            '(?:calling\\s+(?:from|on\\s+behalf\\s+of)|this\\s+is|my\\s+name\\s+is.*?(?:with|from))',
        ],
        requires_metadata: false,
        why_it_matters: 'FTC Telemarketing Sales Rule requires prompt disclosure of the seller\'s identity at the beginning of outbound sales calls.',
        recommended_fix: 'Hi, my name is [Name] calling from [Company Name].',
        legal_reference: '16 C.F.R. § 310.4(d)(1)',
        enabled: true,
        optional: false,
    },
    {
        id: 'DISC-002',
        title: 'Missing Sales Call Nature Disclosure',
        category: 'disclosure',
        description: 'Agent did not disclose that the call is a sales call',
        severity: 'medium',
        triggers: [],
        regex_patterns: [
            '(?:sales|marketing|promotion|offer|special\\s+deal|opportunity)',
        ],
        requires_metadata: false,
        why_it_matters: 'The TSR requires disclosure that the call is for sales purposes before making the sales pitch.',
        recommended_fix: 'I\'m calling today with a special offer for you...',
        legal_reference: '16 C.F.R. § 310.4(d)(2)',
        enabled: true,
        optional: false,
    },
    {
        id: 'DISC-003',
        title: 'Missing Product/Service Description',
        category: 'disclosure',
        description: 'Agent proceeded with pitch without describing what is being sold',
        severity: 'low',
        triggers: [],
        regex_patterns: [],
        requires_metadata: false,
        why_it_matters: 'Consumers should understand what product or service is being offered early in the call.',
        recommended_fix: 'The reason for my call is to tell you about our [product/service]...',
        legal_reference: '16 C.F.R. § 310.4(d)(3)',
        enabled: true,
        optional: false,
    },

    // Consent Rules
    {
        id: 'CONS-001',
        title: 'Consent Revocation Detected',
        category: 'consent',
        description: 'Consumer appears to be revoking consent by reasonable means',
        severity: 'high',
        triggers: [
            'i withdraw my consent',
            'i revoke my consent',
            'i take back my consent',
            'i no longer consent',
            'i didn\'t agree to this',
            'i never agreed',
            'i want to opt out',
            'opt me out',
            'unsubscribe me',
        ],
        regex_patterns: [
            '(?:withdraw|revoke|take\\s+back|cancel)\\s+(?:my\\s+)?(?:consent|permission|authorization)',
            '(?:opt|unsubscribe)\\s+(?:me\\s+)?out',
            '(?:never|didn\'?t)\\s+(?:agree|consent|authorize)',
        ],
        requires_metadata: false,
        why_it_matters: 'Under TCPA, consumers can revoke consent by any reasonable means. Non-standard wording still constitutes valid revocation.',
        recommended_fix: 'I understand you\'d like to revoke your consent. I\'ll process that right away and you\'ll be removed from our calling list.',
        legal_reference: '47 C.F.R. § 64.1200(a)(7)(ii)',
        enabled: true,
        optional: false,
    },

    // Identification Rules
    {
        id: 'IDENT-001',
        title: 'Missing Callback Number',
        category: 'identification',
        description: 'Agent did not provide callback number/address for consumer contact',
        severity: 'low',
        triggers: [],
        regex_patterns: [
            '(?:call\\s+(?:us\\s+)?back\\s+at|reach\\s+us\\s+at|our\\s+number\\s+is|contact\\s+us\\s+at)',
        ],
        requires_metadata: false,
        why_it_matters: 'Telemarketers must provide a means for consumers to reach the business, typically a callback number.',
        recommended_fix: 'If you have any questions, you can reach us at [phone number].',
        legal_reference: '16 C.F.R. § 310.4(d)(7)',
        enabled: true,
        optional: false,
    },

    // Prerecorded Voice Rules
    {
        id: 'PREC-001',
        title: 'Prerecorded Voice Without Consent',
        category: 'prerecorded',
        description: 'Call using prerecorded/artificial voice without required prior express written consent',
        severity: 'high',
        triggers: [],
        regex_patterns: [],
        requires_metadata: true,
        metadata_field: 'is_prerecorded',
        why_it_matters: 'TCPA requires prior express written consent for prerecorded telemarketing calls to cell phones.',
        recommended_fix: 'Ensure written consent is obtained and documented before using prerecorded messages for marketing.',
        legal_reference: '47 U.S.C. § 227(b)(1)(A)',
        enabled: true,
        optional: false,
    },

    // Recording Disclosure Rules (Optional)
    {
        id: 'REC-001',
        title: 'Missing Recording Disclosure',
        category: 'recording_disclosure',
        description: 'Call is being recorded without disclosure (jurisdiction-dependent)',
        severity: 'medium',
        triggers: [],
        regex_patterns: [
            '(?:this\\s+call\\s+(?:is|may\\s+be)\\s+(?:being\\s+)?recorded|call\\s+recording|for\\s+quality\\s+(?:and\\s+training\\s+)?purposes)',
        ],
        requires_metadata: false,
        why_it_matters: 'Some states require two-party consent for call recording. This rule is jurisdiction-dependent and should be reviewed with counsel.',
        recommended_fix: 'This call may be recorded for quality and training purposes. By continuing, you consent to this recording.',
        legal_reference: 'State-specific wiretapping/recording consent laws',
        enabled: true,
        optional: true,
    },
];

export function getRuleById(id: string): Rule | undefined {
    return tcpaRules.find(r => r.id === id);
}

export function getRulesByCategory(category: string): Rule[] {
    return tcpaRules.filter(r => r.category === category);
}

export function getEnabledRules(): Rule[] {
    return tcpaRules.filter(r => r.enabled);
}
