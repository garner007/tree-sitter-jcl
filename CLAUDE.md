# CLAUDE.md - Tree-sitter JCL Development Guidelines

## Project Overview
Tree-sitter grammar for JCL (Job Control Language) targeting z/OS mainframe code analysis. This project creates a parser for JCL that will be used to map mainframe code structures into Neo4j for dependency analysis and code visualization.

## TDD Development Requirements
**MANDATORY**: All grammar development MUST follow Test-Driven Development.

### TDD Process for Grammar Rules
1. **RED**: Write a failing test case in `test/corpus/` that defines the expected parse tree for a JCL construct
2. **GREEN**: Implement the minimal grammar rule in `grammar.js` to make the test pass
3. **REFACTOR**: Improve the grammar structure while keeping all tests green

### Testing Commands
- Run corpus tests: `npx tree-sitter test`
- Run unit tests: `npm test`
- Parse a single file: `npx tree-sitter parse <file.jcl>`
- Generate parser: `npx tree-sitter generate`
- Lint code: `npm run lint`

## Grammar Development Guidelines

### JCL Language Support
- **Primary Target**: z/OS JCL
- **Secondary**: Other JCL dialects where non-conflicting
- **Inline Data**: Support DD * statements and embedded scripts
- **Continuations**: Handle JCL continuation lines properly

### Grammar Structure
- All rules follow lowercase_with_underscores naming
- Statement types: `job_statement`, `exec_statement`, `dd_statement`, `proc_statement`
- Identifiers: `name`, `program_name`, `proc_name`, `dataset_name`
- Parameters: `parameter`, `parameter_list`, `keyword`, `parameter_value`

### Code Quality Standards
- Grammar rules must be unambiguous (no conflicts)
- Test coverage for all major JCL constructs
- Query patterns for all trackable elements
- Documentation for complex grammar decisions

## Query Pattern Development

### Analysis Targets
- **Jobs**: Job names, accounting, class parameters
- **Steps**: Step names, program invocations, procedure calls
- **Datasets**: DSN references, dispositions, temporary datasets
- **Dependencies**: INCLUDE statements, JCLLIB libraries
- **Flow Control**: IF/THEN/ELSE constructs, conditions

### Query Files
- `queries/highlights.scm`: Syntax highlighting
- `queries/locals.scm`: Local scope definitions
- `queries/analysis.scm`: Code analysis captures
- `queries/patterns.scm`: Common JCL patterns

## Project Structure
```
tree-sitter-jcl/
├── grammar.js              # Main grammar definition
├── src/                    # Generated parser code
├── test/                   # Unit tests and corpus tests
│   ├── corpus/            # Parse tree test cases
│   └── *.test.js          # Unit tests
├── queries/               # Tree-sitter query patterns
├── bindings/              # Language bindings
│   └── python/           # Python bindings structure
├── examples/              # Sample JCL files
└── .agent-os/            # Agent OS configuration
```

## Development Workflow

### Adding New Grammar Rules
1. Create test case in `test/corpus/` with expected parse tree
2. Run `npx tree-sitter test` to see failure
3. Add grammar rule in `grammar.js`
4. Run `npx tree-sitter generate`
5. Test until passes: `npx tree-sitter test`
6. Add unit tests if needed
7. Update query patterns for new constructs

### Integration Guidelines
- This grammar will integrate with Python-based mainframe tools
- Focus on producing clean parse trees suitable for graph database mapping
- Query patterns should extract information for Neo4j node/relationship creation
- Support for future integration with existing py3270 tooling

## Best Practices
- Use descriptive names for grammar rules and captures
- Comment complex grammar rules explaining JCL syntax quirks
- Test with real-world JCL examples from mainframe environments
- Keep grammar modular and extensible for future JCL dialect support
- Follow tree-sitter performance guidelines for large JCL files

## Agent OS Integration
- Workflow automation for TDD cycles
- Grammar development tracking via Serena
- Systematic approach to JCL construct implementation
- Quality gates for grammar rule development

## Future Integration
- Python bindings ready for mainframe analysis pipelines
- Query patterns designed for Neo4j dependency mapping
- Extensible structure for additional JCL features
- Separate integration with py3270 connection tools