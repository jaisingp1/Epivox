---
name: skill-creator
description: Create new skills, modify and improve existing skills, and measure skill performance. Use when users want to create a skill from scratch, edit or optimize an existing skill, run evals to test a skill, benchmark skill performance with variance analysis, or optimize a skill's description for better triggering accuracy.
---

# Skill Creator

You are an expert skill architect. Your role is to help users design, create, and optimize skills for AI agents following the Antigravity skill standard.

## When to use this skill

- The user wants to create a new skill from scratch
- The user wants to modify or improve an existing skill
- The user wants to test or evaluate a skill's performance
- The user wants to optimize a skill description for better agent triggering
- The user asks questions about skill best practices
- Trigger keywords: skill, create skill, new skill, skill template, skill format

## Antigravity Skill Standard

### What are Skills?

Skills are reusable packages of knowledge that extend what the agent can do. Each skill contains:
- **Instructions** for how to approach a specific type of task
- **Best practices** and conventions to follow
- **Optional scripts and resources** the agent can use

### Skill Locations

Antigravity supports two types of skills:

| Location | Scope |
|----------|-------|
| `<workspace-root>/.agents/skills/<skill-folder>/` | Workspace-specific |
| `~/.gemini/antigravity/skills/<skill-folder>/` | Global (all workspaces) |

**Note**: Antigravity now defaults to `.agents/skills`, but maintains backward support for `.agent/skills`.

### Required Structure

Every skill needs:
1. A folder for the skill
2. A `SKILL.md` file with YAML frontmatter

```
.agents/skills/
└── my-skill/
    └── SKILL.md
```

### Frontmatter Fields

| Field | Required | Description |
|-------|----------|-------------|
| `name` | No | A unique identifier (lowercase, hyphens for spaces). Defaults to folder name. |
| `description` | **Yes** | Clear description of what the skill does and when to use it. This is what the agent sees when deciding whether to apply the skill. |

**Important**: Write descriptions in third person and include keywords that help the agent recognize when the skill is relevant.

### Extended Folder Structure

```
.agents/skills/my-skill/
├── SKILL.md           # Main instructions (required)
├── scripts/           # Helper scripts (optional)
│   └── helper.ts
├── examples/          # Reference implementations (optional)
│   └── example.md
└── resources/         # Templates and other assets (optional)
    └── template.md
```

## Skill Creation Process

### Step 1: Understand the Goal

Ask clarifying questions to understand:
- What specific task should the skill help with?
- What type of user would use this skill?
- What are the success criteria?
- Should this be a workspace or global skill?

### Step 2: Define the Skill Identity

Based on the goal, determine:
- **Name**: Lowercase, hyphen-separated (e.g., `api-docs-generator`)
- **Description**: Clear, specific, written in third person. Include keywords for triggering.

### Step 3: Structure the Content

Organize the SKILL.md with these sections:

1. **When to use this skill** - Clear trigger conditions
2. **How to use it** - Step-by-step instructions
3. **Best practices** - Conventions and patterns to follow
4. **Examples** (optional) - Reference implementations
5. **Decision trees** (for complex skills) - Help choose the right approach

### Step 4: Add Supporting Resources (Optional)

If the skill needs additional files:
- `scripts/` - Helper scripts the agent can execute
- `examples/` - Reference implementations
- `resources/` - Templates and other assets

### Step 5: Register in Ecosystem (MANDATORY)

Once a skill is created or significantly modified, you **MUST** update `epiroc-ecosystem/SKILL.md` to:
1. Add the skill to the **Skills Overview** table.
2. Update the **Interaction Matrix** or **Coordinaton Rules** if it introduces new handoffs.
3. Ensure no overlap with existing skills.

## Skill Template

Use this template for new skills:

```markdown
---
name: skill-name
description: Clear description of what the skill does and when to use it. Include relevant keywords for triggering.
---

# [Skill Name]

Brief introduction to the skill.

## When to use this skill

- Use this when [specific condition]
- This is helpful for [use case]
- Trigger keywords: [relevant keywords]

## How to use it

### Step 1: [Action]
Detailed instructions...

### Step 2: [Action]
Detailed instructions...

## Best Practices

- [Practice 1]
- [Practice 2]
- [Practice 3]

## Examples

[Optional: Reference implementations or usage examples]

## Decision Tree (for complex skills)

If [condition A]:
  - Do [action A]
Else if [condition B]:
  - Do [action B]
```

## Best Practices for Skill Design

### 1. Keep Skills Focused

Each skill should do **one thing well**. Avoid "do everything" skills.

**Good**: `typescript-test-generator`, `api-docs-writer`
**Bad**: `typescript-helper`, `code-assistant`

### 2. Write Clear Descriptions

The description determines when the agent triggers the skill.

**Good**: "Generates comprehensive unit tests for TypeScript code using Vitest conventions. Creates test files with proper fixtures, mocks, and edge case coverage."
**Bad**: "Helps with TypeScript testing."

### 3. Use Scripts as Black Boxes

When including scripts, instruct the agent to:
1. Run `script.ts --help` first
2. Follow the usage instructions
3. Not read the entire source code

### 4. Include Decision Trees

For complex skills, provide logic to help the agent choose:

```
If the task involves creating new files:
  → Use the scaffolding approach
If the task involves modifying existing files:
  → Use the modification checklist
If the task involves debugging:
  → Use the diagnostic workflow
```

## Skill Evaluation Checklist

Before finalizing a skill, verify:

- [ ] Name is lowercase with hyphens
- [ ] Description is clear and includes trigger keywords
- [ ] "When to use this skill" section is present
- [ ] Instructions are step-by-step and actionable
- [ ] Best practices are included
- [ ] Skill does one thing well (not too broad)
- [ ] For complex skills: decision tree is included
- [ ] For scripts: usage instructions reference --help

## Common Skill Patterns

### Code Generation Skills
Focus on: syntax correctness, conventions, error handling

### Documentation Skills
Focus on: structure, clarity, completeness

### Analysis Skills
Focus on: methodology, output format, actionable insights

### Integration Skills
Focus on: prerequisites, setup steps, troubleshooting

## Output Format

When creating a skill, always provide:
1. The complete file path
2. The full SKILL.md content
3. Any supporting files (scripts, examples, resources)
4. A brief summary of what the skill does

## Example: Creating a Skill

User request: "Create a skill for generating API documentation"

### Step 1: Clarify
- What format? (OpenAPI, Markdown, HTML)
- What language/framework?
- Any specific conventions?

### Step 2: Create the skill

```markdown
---
name: api-docs-generator
description: Generates comprehensive API documentation from code annotations and OpenAPI specs. Creates markdown or HTML documentation with examples, authentication details, and error response documentation.
---

# API Documentation Generator

Generates structured API documentation from various sources.

## When to use this skill

- Use when you need to document REST APIs
- Use when generating documentation from OpenAPI/Swagger specs
- Trigger keywords: API docs, endpoint documentation, swagger, openapi

## How to use it

### Step 1: Analyze the API
- Identify all endpoints
- Document request/response schemas
- Note authentication requirements

### Step 2: Generate Documentation
- Create endpoint descriptions
- Add request examples
- Document error responses

## Best Practices

- Include working code examples
- Document all error codes
- Keep descriptions concise but complete
- Use consistent formatting
```

### Step 3: Save and verify
- Save to `.agents/skills/api-docs-generator/SKILL.md`
- Run evaluation checklist
- Test with sample requests

## Scripts Available

This skill includes helper scripts in the `scripts/` directory:

| Script | Purpose |
|--------|---------|
| `quick_validate.ts` | Quick validation of skill structure |
| `run_eval.ts` | Run evaluation tests on a skill |
| `improve_description.ts` | Optimize skill descriptions |
| `package_skill.ts` | Package a skill for distribution |
| `generate_report.ts` | Generate performance reports |
| `aggregate_benchmark.ts` | Aggregate benchmark results |

### Using Scripts

Always run scripts with `--help` first to understand usage:

```bash
npx tsx scripts/quick_validate.ts --help
npx tsx scripts/run_eval.ts --help
```
