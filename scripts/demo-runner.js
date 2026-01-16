#!/usr/bin/env node

/**
 * Whisperwire Demo Runner
 * 
 * This script simulates a live call center session by replaying
 * transcript segments at realistic intervals.
 * 
 * Usage:
 *   node scripts/demo-runner.js [scenario]
 * 
 * Available scenarios:
 *   - dnc-request (default): Customer requests DNC, agent continues
 *   - dnc-listed: Call to DNC-listed number
 *   - consent-revocation: Non-standard consent revocation
 *   - missing-disclosures: Improper call opening
 *   - prerecorded: Prerecorded message without consent
 */

const scenarios = {
    'dnc-request': {
        name: 'DNC Request Scenario',
        description: 'Customer requests DNC, agent improperly continues selling',
        metadata: {
            call_id: 'demo-001',
            agent_id: 'agent-001',
            agent_name: 'Sarah Johnson',
            call_type: 'outbound_sales',
            is_dnc_listed: false,
            has_prior_consent: true,
            is_prerecorded: false,
        },
        segments: [
            { speaker: 'agent', text: 'Hi, this is Sarah calling from TeleSolutions with an exciting offer for you today.', delay: 0 },
            { speaker: 'customer', text: 'Who is this?', delay: 4500 },
            { speaker: 'agent', text: 'This is Sarah from TeleSolutions. We have a limited time offer on our premium internet package that could save you up to 40% on your monthly bill.', delay: 6000 },
            { speaker: 'customer', text: "Look, I'm not interested. Don't call me again, please.", delay: 14000 },
            { speaker: 'agent', text: 'I understand, but before you go, let me just tell you about our special promotion that ends today.', delay: 18000 },
            { speaker: 'customer', text: 'I said stop calling me! Put me on your do not call list right now.', delay: 25000 },
            { speaker: 'agent', text: "Understood—I'll add you to our Do Not Call list effective immediately. You won't receive any more marketing calls from us. Have a great day.", delay: 30000 },
        ],
    },
    'dnc-listed': {
        name: 'DNC Listed Number',
        description: 'Marketing call to National DNC Registry number',
        metadata: {
            call_id: 'demo-002',
            agent_id: 'agent-002',
            agent_name: 'Mike Thompson',
            call_type: 'outbound_sales',
            is_dnc_listed: true,
            has_prior_consent: false,
            is_prerecorded: false,
        },
        segments: [
            { speaker: 'agent', text: 'Good morning! This is Mike from Premium Services calling about an exclusive offer.', delay: 0 },
            { speaker: 'customer', text: 'Hello? What company is this?', delay: 5500 },
            { speaker: 'agent', text: "This is Mike from Premium Services. I'm calling because you've been selected for our VIP discount program.", delay: 7500 },
            { speaker: 'customer', text: 'I never signed up for anything. How did you get my number?', delay: 14000 },
        ],
    },
    'consent-revocation': {
        name: 'Consent Revocation',
        description: 'Customer revokes consent using non-standard phrasing',
        metadata: {
            call_id: 'demo-003',
            agent_id: 'agent-003',
            agent_name: 'Jennifer Davis',
            call_type: 'outbound_sales',
            is_dnc_listed: false,
            has_prior_consent: true,
            is_prerecorded: false,
        },
        segments: [
            { speaker: 'agent', text: "Hi, this is Jennifer from DataCloud. I'm calling about your subscription renewal.", delay: 0 },
            { speaker: 'customer', text: 'Oh, right. What about it?', delay: 5500 },
            { speaker: 'agent', text: "We have some great upgrade options that I'd love to tell you about. Our new premium tier includes unlimited storage.", delay: 7500 },
            { speaker: 'customer', text: 'Actually, I want to opt out of these marketing calls. I withdraw my consent for you to contact me.', delay: 15000 },
            { speaker: 'agent', text: "I understand you'd like to revoke your consent. I'll process that right away and you'll be removed from our calling list. Is there anything else I can help with regarding your existing account?", delay: 22000 },
        ],
    },
    'missing-disclosures': {
        name: 'Missing Required Disclosures',
        description: 'Agent fails to provide required TSR disclosures',
        metadata: {
            call_id: 'demo-004',
            agent_id: 'agent-004',
            agent_name: 'Chris Martinez',
            call_type: 'outbound_sales',
            is_dnc_listed: false,
            has_prior_consent: true,
            is_prerecorded: false,
        },
        segments: [
            { speaker: 'agent', text: "Hello! So you're definitely going to want to hear about this amazing deal we've got going on.", delay: 0 },
            { speaker: 'customer', text: 'Wait, who is this?', delay: 5500 },
            { speaker: 'agent', text: "Oh, right! I'm Chris calling from SuperSavers. We're reaching out because you qualify for 50% off our annual membership!", delay: 7500 },
            { speaker: 'customer', text: 'What is this membership for exactly?', delay: 15000 },
            { speaker: 'agent', text: "It's our premium discount club that gives you access to exclusive deals at over 10,000 retailers. I'm calling to offer you our special promotional rate.", delay: 17500 },
        ],
    },
    'prerecorded': {
        name: 'Prerecorded Voice Without Consent',
        description: 'Robocall without prior express written consent',
        metadata: {
            call_id: 'demo-005',
            agent_id: 'system',
            agent_name: 'Automated System',
            call_type: 'outbound_sales',
            is_dnc_listed: false,
            has_prior_consent: false,
            is_prerecorded: true,
        },
        segments: [
            { speaker: 'agent', text: 'Hello! This is an important message from ValuePlus about a special limited-time offer available exclusively to you.', delay: 0 },
            { speaker: 'agent', text: 'Press 1 now to speak with a representative and claim your free gift valued at over $200.', delay: 6500 },
            { speaker: 'agent', text: "This offer expires at midnight tonight, so don't delay! Press 1 now or call us back at 1-800-555-0123.", delay: 13000 },
        ],
    },
};

function printHeader() {
    console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                           ║
║   ██╗    ██╗██╗  ██╗██╗███████╗██████╗ ███████╗██████╗ ██╗    ██╗██╗██████╗ ███████╗
║   ██║    ██║██║  ██║██║██╔════╝██╔══██╗██╔════╝██╔══██╗██║    ██║██║██╔══██╗██╔════╝
║   ██║ █╗ ██║███████║██║███████╗██████╔╝█████╗  ██████╔╝██║ █╗ ██║██║██████╔╝█████╗  
║   ██║███╗██║██╔══██║██║╚════██║██╔═══╝ ██╔══╝  ██╔══██╗██║███╗██║██║██╔══██╗██╔══╝  
║   ╚███╔███╔╝██║  ██║██║███████║██║     ███████╗██║  ██║╚███╔███╔╝██║██║  ██║███████╗
║    ╚══╝╚══╝ ╚═╝  ╚═╝╚═╝╚══════╝╚═╝     ╚══════╝╚═╝  ╚═╝ ╚══╝╚══╝ ╚═╝╚═╝  ╚═╝╚══════╝
║                                                                           ║
║                   TCPA Compliance Copilot - Demo Runner                   ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
`);
}

function printScenarioList() {
    console.log('\nAvailable scenarios:\n');
    Object.entries(scenarios).forEach(([key, scenario]) => {
        console.log(`  ${key.padEnd(20)} - ${scenario.name}`);
        console.log(`  ${''.padEnd(20)}   ${scenario.description}\n`);
    });
}

function formatTime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runScenario(scenarioKey) {
    const scenario = scenarios[scenarioKey];

    if (!scenario) {
        console.error(`Unknown scenario: ${scenarioKey}`);
        printScenarioList();
        process.exit(1);
    }

    console.log(`\n${'═'.repeat(75)}`);
    console.log(`  SCENARIO: ${scenario.name}`);
    console.log(`  ${scenario.description}`);
    console.log(`${'═'.repeat(75)}\n`);

    console.log('Call Metadata:');
    console.log(`  Agent: ${scenario.metadata.agent_name} (${scenario.metadata.agent_id})`);
    console.log(`  Call Type: ${scenario.metadata.call_type}`);
    console.log(`  DNC Listed: ${scenario.metadata.is_dnc_listed ? '⚠️  YES' : 'No'}`);
    console.log(`  Prior Consent: ${scenario.metadata.has_prior_consent ? 'Yes' : '⚠️  NO'}`);
    console.log(`  Prerecorded: ${scenario.metadata.is_prerecorded ? '⚠️  YES' : 'No'}`);
    console.log(`\n${'─'.repeat(75)}\n`);

    console.log('Starting call simulation in 3 seconds...\n');
    await sleep(3000);

    let lastTime = 0;

    for (const segment of scenario.segments) {
        const waitTime = segment.delay - lastTime;
        if (waitTime > 0) {
            await sleep(Math.min(waitTime, 2000)); // Cap wait time for demo
        }

        const speaker = segment.speaker === 'agent' ? '🎧 AGENT' : '👤 CUSTOMER';
        const color = segment.speaker === 'agent' ? '\x1b[36m' : '\x1b[33m';
        const reset = '\x1b[0m';

        console.log(`[${formatTime(segment.delay)}] ${color}${speaker}:${reset}`);
        console.log(`         ${segment.text}\n`);

        // Check for potential alerts
        const alertPatterns = [
            { pattern: /don'?t call me|stop calling|remove me/i, alert: '🚨 ALERT [DNC-001]: Customer requested no further calls!' },
            { pattern: /before you go|just one more|let me just/i, alert: '🚨 ALERT [DNC-002]: Agent continued after DNC request!' },
            { pattern: /withdraw.*consent|revoke.*consent|opt out/i, alert: '🚨 ALERT [CONS-001]: Consent revocation detected!' },
        ];

        for (const { pattern, alert } of alertPatterns) {
            if (pattern.test(segment.text)) {
                console.log(`\x1b[31m         ${alert}\x1b[0m\n`);
            }
        }

        lastTime = segment.delay;
    }

    // Check metadata alerts
    if (scenario.metadata.is_dnc_listed && !scenario.metadata.has_prior_consent) {
        console.log('\x1b[31m🚨 METADATA ALERT [DNC-003]: Number on National DNC list without consent!\x1b[0m\n');
    }

    if (scenario.metadata.is_prerecorded && !scenario.metadata.has_prior_consent) {
        console.log('\x1b[31m🚨 METADATA ALERT [PREC-001]: Prerecorded voice without consent!\x1b[0m\n');
    }

    console.log(`${'═'.repeat(75)}`);
    console.log('  Demo complete. Run "npm run dev" to see the full interactive UI.');
    console.log(`${'═'.repeat(75)}\n`);
}

// Main
printHeader();

const scenarioKey = process.argv[2] || 'dnc-request';

if (scenarioKey === '--list' || scenarioKey === '-l') {
    printScenarioList();
} else {
    runScenario(scenarioKey);
}
