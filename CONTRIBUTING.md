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

- Use a clear and descriptive title
- Describe the exact steps to reproduce the problem
- Describe the behavior you observed and what you expected
- Include screenshots if applicable
- Include your environment details (OS, Node version, Rust version, browser, etc.)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- Use a clear and descriptive title
- Provide a detailed description of the proposed enhancement
- Explain why this enhancement would be useful for compliance monitoring
- Include mockups or examples if applicable

### Pull Requests

1. Fork the repo and create your branch from `main`
2. If you've added code that should be tested, add tests
3. If you've changed APIs, update the documentation
4. Ensure the test suite passes
5. Make sure your code lints
6. Submit the pull request!

## Development Setup

### Prerequisites

- **Node.js** 18+
- **npm** or **pnpm**
- **Rust** (for Tauri development)
- **Ollama** (optional, for LLM mode testing)

### Getting Started

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/whisperwire.git
cd whisperwire

# Add upstream remote
git remote add upstream https://github.com/ryanshatz/whisperwire.git

# Install frontend dependencies
cd app
npm install

# Start development (web mode)
npm run dev

# Or start Tauri development (requires Rust)
npm run tauri dev
```

### Optional: LLM Mode Setup

```bash
# Install Ollama from https://ollama.ai
# Pull a model
ollama pull llama3.2:1b

# Start Ollama server
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
├── docs/                     # Documentation
│   ├── architecture.md
│   ├── ruleset.md
│   └── images/
│
├── rules/                    # TCPA rule definitions
└── scripts/                  # Build and utility scripts
```

## Commands

```bash
# Frontend (from /app directory)
npm run dev           # Start Next.js dev server
npm run build         # Build production bundle
npm run lint          # Lint code

# Tauri (from /app directory)
npm run tauri dev     # Start Tauri dev mode
npm run tauri build   # Build desktop executable
```

## Code Style

### TypeScript

- Use TypeScript strict mode
- Prefer `const` over `let`
- Use meaningful variable names
- Add JSDoc comments for public APIs
- Define interfaces in `/types` directory

### React

- Use functional components with hooks
- Keep components small and focused
- Use Tailwind CSS for styling
- Follow existing component patterns in `AgentView.tsx`, `AdminView.tsx`

### Rust

- Follow Rust conventions and idioms
- Use descriptive error messages
- Document public functions with `///` comments
- Keep Tauri commands focused and minimal

### Rules & Compliance

- When adding new TCPA rules, follow the schema in `rules.ts`
- Include `id`, `title`, `description`, `severity`, `category`, and `triggers`
- Add corresponding Rust definitions in `rules.rs`
- Update documentation in `docs/ruleset.md`

## Commits

We follow conventional commits:

```
feat: Add new DNC verification rule
fix: Correct time zone detection for calling hours
docs: Update rule library documentation
refactor: Simplify compliance score calculation
test: Add unit tests for evaluator
chore: Update dependencies
```

## Testing

### Running Tests

```bash
# Frontend tests
npm test

# Rust tests (from /app/src-tauri)
cargo test
```

Tests should:

- Be independent and isolated
- Test one thing at a time
- Have descriptive names
- Cover edge cases
- Include compliance rule detection scenarios

## Adding New Rules

When contributing new TCPA rules:

1. Add the rule definition to `app/src/lib/rules.ts`
2. Add corresponding Rust definition to `app/src-tauri/src/rules.rs`
3. Include trigger phrases and regex patterns
4. Define appropriate severity level (High/Medium/Low)
5. Add suggested response text
6. Update `docs/ruleset.md` with rule documentation
7. Test with realistic transcript scenarios

## Documentation

When adding features:

- Update relevant docs in `/docs`
- Add JSDoc comments to code
- Update README if adding major features
- Include usage examples

## Review Process

- All changes require a pull request
- At least one approval is required
- CI must pass (tests, lint, build)
- Changes should be squash-merged

## Questions?

Feel free to open an issue with the `question` label or reach out to the maintainers.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Whisperwire! 🎉
