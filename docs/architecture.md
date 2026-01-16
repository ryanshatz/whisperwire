# Whisperwire Architecture

This document describes the technical architecture of Whisperwire, a real-time TCPA compliance copilot for call centers.

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              WHISPERWIRE                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                         Next.js Frontend                              │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐     │  │
│  │  │ Agent View │  │ Admin View │  │ Rules View │  │  Settings  │     │  │
│  │  └────────────┘  └────────────┘  └────────────┘  └────────────┘     │  │
│  │         │               │               │              │             │  │
│  │         └───────────────┼───────────────┼──────────────┘             │  │
│  │                         ▼                                             │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐ │  │
│  │  │              State Management (Zustand)                          │ │  │
│  │  └─────────────────────────────────────────────────────────────────┘ │  │
│  │                         │                                             │  │
│  │                         ▼                                             │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐ │  │
│  │  │           Frontend Evaluator (Rules-only mode)                   │ │  │
│  │  └─────────────────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                              │                                              │
│                              ▼ Tauri IPC                                    │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                        Rust Backend                                   │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐     │  │
│  │  │ Evaluator  │  │ Rule Loader│  │ LLM Client │  │  Database  │     │  │
│  │  │  Engine    │  │            │  │ (Ollama)   │  │  (SQLite)  │     │  │
│  │  └────────────┘  └────────────┘  └────────────┘  └────────────┘     │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
                    ┌─────────────────────────────────┐
                    │     Local LLM (Optional)        │
                    │   Ollama / llama.cpp            │
                    │   Model: llama3.2:1b            │
                    └─────────────────────────────────┘
```

## Components

### 1. Frontend (Next.js + React)

The frontend is built with Next.js 16 and React 19, using TypeScript for type safety.

**Key Features:**
- Server-side rendering for initial load performance
- Client-side state management with Zustand
- Real-time transcript streaming simulation
- Framer Motion for smooth animations
- Accessible UI with ARIA labels and keyboard navigation

**Views:**
- **Agent View**: Live transcript panel, compliance alerts, suggested responses
- **Admin View**: Analytics dashboard, alert logs, export functionality
- **Rules View**: Searchable, categorized rule library

### 2. Backend (Rust + Tauri)

The Rust backend handles core compliance logic and data persistence.

**Modules:**
- `lib.rs`: Main entry point, Tauri command handlers
- `database.rs`: SQLite database operations
- `rules.rs`: Rule definitions and parsing
- `evaluator.rs`: Regex-based compliance evaluation
- `llm.rs`: Ollama/llama.cpp integration

**Tauri Commands:**
- `evaluate_transcript`: Analyze transcript for compliance issues
- `store_alert`: Persist alerts to SQLite
- `get_alerts`: Query alerts with filters
- `get_analytics`: Aggregate analytics data
- `export_alerts_json`: Export alerts for reporting

### 3. Compliance Evaluator

The evaluator runs in two modes:

**Rules-Only Mode (Default):**
- Uses regex patterns and keyword matching
- No external dependencies
- Fast, deterministic results
- Good for 80%+ of common compliance scenarios

**LLM-Enhanced Mode (Optional):**
- Connects to local Ollama instance
- Uses master system prompt with full ruleset
- Better at nuanced language understanding
- Handles edge cases and non-standard phrasing

### 4. Database (SQLite)

Local SQLite database stores:
- Call session metadata
- Compliance alerts with full context
- Analytics aggregations

**Schema:**
```sql
-- calls: Track call sessions
CREATE TABLE calls (
    call_id TEXT PRIMARY KEY,
    agent_id TEXT NOT NULL,
    agent_name TEXT NOT NULL,
    call_start_time TEXT NOT NULL,
    call_end_time TEXT,
    -- ... metadata fields
);

-- alerts: Store compliance alerts
CREATE TABLE alerts (
    id TEXT PRIMARY KEY,
    call_id TEXT NOT NULL,
    rule_id TEXT NOT NULL,
    severity TEXT NOT NULL,
    confidence INTEGER NOT NULL,
    -- ... evidence and fix suggestion
    FOREIGN KEY (call_id) REFERENCES calls(call_id)
);
```

## Data Flow

### Real-time Evaluation Flow

```
1. Audio/Transcript Input
         │
         ▼
2. Segment Parsing (speaker, timing, text)
         │
         ▼
3. Incremental Evaluation
   ├── Check metadata rules (DNC list, prerecorded, etc.)
   ├── Check trigger phrases (exact keyword matches)
   └── Check regex patterns (flexible pattern matching)
         │
         ▼
4. Alert Generation
   ├── Generate unique ID
   ├── Calculate confidence score
   ├── Extract evidence quote
   └── Attach recommended fix
         │
         ▼
5. Display & Storage
   ├── Push to UI (toast + alert panel)
   └── Persist to SQLite
```

### LLM Evaluation Flow

```
1. Build Context
   ├── Call metadata
   ├── Full transcript
   └── Conversation history
         │
         ▼
2. Generate System Prompt
   └── Include all enabled rules with:
       ├── Rule ID and title
       ├── Severity level
       ├── Trigger patterns
       └── Legal references
         │
         ▼
3. Call Local LLM
   └── Ollama API (localhost:11434)
         │
         ▼
4. Parse JSON Response
   ├── Validate alert schema
   ├── Verify rule IDs exist
   └── Sanitize suggestions
         │
         ▼
5. Merge with Regex Results
   └── Deduplicate by rule_id
```

## Rule System

Rules are defined in YAML (`rules/tcpa-rules.yaml`) and loaded at runtime.

**Rule Structure:**
```yaml
- id: DNC-001
  title: Customer Requested No Further Calls
  category: do_not_call
  severity: high
  triggers:
    - "don't call me"
    - "remove me from your list"
  regex_patterns:
    - "(?i)(don'?t|do\\s*not|stop)\\s+(call|contact)"
  requires_metadata: false
  why_it_matters: "Under TCPA, consumers can revoke..."
  recommended_fix: "Understood—I'll add you to our DNC list..."
  legal_reference: "47 U.S.C. § 227(c)"
  enabled: true
  optional: false
```

## State Management

Frontend state is managed with Zustand:

```typescript
interface AppStore {
  // Call state
  currentCall: CallMetadata | null;
  transcript: TranscriptSegment[];
  
  // Alerts
  alerts: Alert[];
  selectedAlertId: string | null;
  
  // Actions
  addSegment: (segment: TranscriptSegment) => void;
  addAlert: (alert: Alert) => void;
  clearSession: () => void;
}
```

## Security Considerations

1. **Local-Only by Default**: No data leaves the machine
2. **No External API Calls**: LLM runs locally via Ollama
3. **SQLite Encryption**: Optional at-rest encryption
4. **Audit Logging**: All evaluations logged with timestamps

## Performance

- **Evaluation Latency**: <50ms for regex-only mode
- **LLM Latency**: 200-500ms depending on model size
- **Memory Usage**: ~200MB base, +500MB with loaded LLM
- **Database Size**: ~1KB per alert, ~10KB per call session

## Extensibility

The architecture supports future extensions:

1. **Custom Rules**: Add new YAML rules without code changes
2. **Multiple LLMs**: Swap models via configuration
3. **Audio Integration**: Add transcription service
4. **Cloud Sync**: Optional encrypted backup
5. **Team Features**: Multi-agent dashboards

## Technology Stack

| Component | Technology |
|-----------|------------|
| Desktop Framework | Tauri 2.x |
| Frontend | Next.js 16, React 19 |
| Styling | Tailwind CSS 4 |
| Animations | Framer Motion 11 |
| State Management | Zustand 5 |
| Backend | Rust |
| Database | SQLite (rusqlite) |
| Local LLM | Ollama |
| Bundling | Webpack (via Next.js) |
