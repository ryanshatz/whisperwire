# Contributing to Whisperwire

First off, thank you for considering contributing to Whisperwire! It's people like you that make Whisperwire such a great tool for compliance teams everywhere.

## Code of Conduct

By participating in this project, you are expected to uphold our Code of Conduct:

- Use welcoming and inclusive language
- Be respectful of differing viewpoints and experiences
- Gracefully accept constructive criticism
- Focus on what is best for the community
- Show empathy towards other community members

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Describe the behavior you observed and what you expected**
- **Include screenshots if applicable** (especially for UI issues)
- **Include your environment details:**
  - OS and version
  - Node.js version
  - Rust version (if using Tauri desktop app)
  - Ollama version (if using LLM mode)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- **Use a clear and descriptive title**
- **Provide a detailed description of the proposed enhancement**
- **Explain why this enhancement would be useful** for compliance monitoring
- **Include mockups or examples if applicable**
- **Consider privacy implications** – Whisperwire is local-first by design

### Adding New Compliance Rules

One of the best ways to contribute is by adding new TCPA rules or improving detection accuracy:

1. Review existing rules in `rules/tcpa-rules.yaml`
2. Follow the established YAML schema
3. Include trigger phrases, regex patterns, and metadata checks
4. Add corresponding frontend rules in `app/src/lib/rules.ts`
5. Test thoroughly with realistic call scenarios

### Pull Requests

1. Fork the repo and create your branch from `main`
2. If you've added code that should be tested, add tests
3. If you've changed APIs, update the documentation
4. Ensure the test suite passes
5. Make sure your code lints
6. Submit the pull request!

## Development Setup

### Prerequisites

- **Node.js** 18+ (required)
- **pnpm** or **npm** (package manager)
- **Rust** (only required for Tauri desktop app)
- **Ollama** (optional, for LLM mode testing)

### Getting Started

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/whisperwire.git
cd whisperwire

# Add upstream remote
git remote add upstream https://github.com/ryanshatz/whisperwire.git

# Navigate to app directory
cd app

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will open at **http://localhost:3000**

### Building Desktop App (Tauri)

```bash
# Ensure Rust is installed
rustup update

# Build for development
npm run tauri:dev

# Build for production
npm run tauri:build
```

### Testing LLM Mode

```bash
# Install and start Ollama
ollama pull llama3.2:1b
ollama serve
```

## Project Structure

```
whisperwire/
├── app/                      # Main application
│   ├── src/                  # Next.js frontend
│   │   ├── app/              # Pages and layouts
│   │   ├── components/       # React components
│   │   │   ├── AgentView.tsx
│   │   │   ├── AdminView.tsx
│   │   │   └── RulesView.tsx
│   │   ├── lib/              # Utilities
│   │   │   ├── evaluator.ts  # Frontend rule evaluation
│   │   │   └── rules.ts      # TCPA rule definitions
│   │   └── types/            # TypeScript types
│   │
│   └── src-tauri/            # Rust backend (Tauri)
│       └── src/
│           ├── lib.rs        # Main entry, Tauri commands
│           ├── evaluator.rs  # Compliance evaluation engine
│           ├── llm.rs        # Ollama LLM integration
│           ├── rules.rs      # Rule definitions (YAML format)
│           └── database.rs   # SQLite storage
│
├── rules/                    # TCPA rule definitions
│   └── tcpa-rules.yaml
│
├── docs/                     # Documentation
│   ├── architecture.md
│   ├── ruleset.md
│   └── images/
│
└── scripts/                  # Utility scripts
```

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js development server |
| `npm run build` | Build for production |
| `npm run lint` | Lint code with ESLint |
| `npm run test` | Run test suite |
| `npm run tauri:dev` | Start Tauri development mode |
| `npm run tauri:build` | Build Tauri desktop app |
| `npm run demo` | Run demo scenario |

## Code Style

### TypeScript

- Use TypeScript strict mode
- Prefer `const` over `let`
- Use meaningful variable names
- Add JSDoc comments for public APIs
- Define types in `src/types/`

### React

- Use functional components with hooks
- Keep components small and focused
- Use Framer Motion for animations
- Follow the existing component patterns in `src/components/`

### Rust (Tauri Backend)

- Follow Rust idioms and best practices
- Use `Result` types for error handling
- Document public functions
- Keep Tauri commands thin, delegate to modules

### Styling

- Use Tailwind CSS for styling
- Follow the dark theme with glass morphism effects
- Maintain the premium UI aesthetic
- Test on both light and dark system preferences

## Commits

We follow conventional commits:

```
feat: Add new consent revocation detection rule
fix: Correct DNC phrase matching regex
docs: Update installation instructions
refactor: Simplify alert state management
test: Add unit tests for evaluator
style: Fix inconsistent button spacing
```

## Testing

### Unit Tests

```bash
npm run test
```

Tests should:
- Be independent and isolated
- Test one thing at a time
- Have descriptive names
- Cover edge cases
- Test both rule matches and non-matches

### Manual Testing

When testing compliance detection:
- Use realistic call transcripts
- Test both agent and customer utterances
- Verify alert severity levels
- Check confidence scores
- Test LLM mode if available

## Documentation

When adding features:

- Update relevant docs in `/docs`
- Add JSDoc comments to code
- Update README if user-facing
- Include examples for new rules
- Add screenshots for UI changes

## Review Process

- All changes require a pull request
- At least one approval is required
- CI must pass (tests, lint, build)
- Changes should be squash-merged

## Security Considerations

Whisperwire handles sensitive call data. Please ensure:

- **No data leaves the machine** – Maintain local-first architecture
- **No external API calls** – Except to local Ollama
- **No logging of PII** – Personal information should never be logged
- **No telemetry** – Respect user privacy

## Questions?

Feel free to open an issue with the `question` label or reach out to the maintainers.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

<p align="center">
  Thank you for contributing to Whisperwire! 🎉
</p>
