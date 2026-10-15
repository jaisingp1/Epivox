---
name: epiroc-review
description: Reviews skill execution failures and user feedback to evolve and improve skills. Analyzes chat history to identify what went wrong, extracts lessons learned, and updates the involved skills to prevent recurrence. Use when a skill didn't execute correctly, the user provides negative feedback, or when skills need to be updated based on real-world usage patterns.
---

# Epiroc Skill Review & Evolution

This skill provides a systematic approach to reviewing skill failures, extracting lessons from user feedback, and updating skills to make them evolve and improve over time.

## When to use this skill

- A skill didn't execute or performed incorrectly
- User provides feedback that something is wrong or missing
- **Data Rule Violation**: Mockup data hardcoded or unrealistic
- **QA Failure**: Missing test steps or front/back errors
- Trigger keywords: review, learn, evolve, improve, analysis, failure, feedback, lesson, **qa-failure**, **data-violation**

## Dependencies

This skill coordinates with:
- **All epiroc-* skills**: As targets for updates
- **epiroc-debugging**: For identifying what went wrong
- **skill-creator**: For skill structure validation

## Review Workflow

### Phase 1: Detection

#### 1.1 Identify the Problem

First, identify what went wrong by analyzing the conversation context:

```markdown
## Problem Detection Checklist

### What was the user's request?
[Original request that triggered skill(s)]

### What skills were activated?
[List of skills that were involved]

### What was the expected outcome?
[What should have happened]

### What actually happened?
[What actually occurred]

### User's feedback/indication of failure:
[Direct quote or paraphrase of user feedback]
```

#### 1.2 Skill Involvement Analysis

Identify which skills should have been involved and which actually were:

```
User Request: "_________________"

Expected Skills:
├── [ ] epiroc-coding (always involved in code)
├── [ ] epiroc-ux (layout/page issues)
├── [ ] epiroc-ui (style/color issues)
├── [ ] epiroc-components (component issues)
├── [ ] epiroc-debugging (error handling)
└── [ ] Other: _____________

Skills Actually Activated:
├── [List skills that were triggered]

Skills Missing (should have activated but didn't):
├── [List skills that should have activated]

Skill Execution Gaps:
├── [Skills that activated but didn't perform correctly]
```

### Phase 2: Root Cause Analysis

#### 2.1 Why Did It Fail?

| Failure Type | Symptoms | Root Cause |
|-------------|----------|------------|
| **Data Rule Violation** | Hardcoded or small mockup data | Update epiroc-coding with stricter scanning |
| **QA Failure (Frontend)** | Browser errors or style issues | Update epiroc-qa with browser check steps |
| **QA Failure (Backend)** | Callback or logic errors | Update epiroc-qa with logic verification |
| **Immediate Debugging** | Traceback or Exception in chat | **MANDATORY**: Activate epiroc-debugging immediately |
| **Inconsistent Flow** | Mockup doesn't follow business flow | Update epiroc-mockup-data with state rules |
| Skill didn't activate | Missing keywords | epiroc-review improves trigger keywords |

#### 2.2 Extract the Lesson

```markdown
## Lesson Extraction Template

### What specific knowledge was missing?
[The exact gap in the skill's knowledge]

### What would have prevented this failure?
[Specific instruction, pattern, or check that would help]

### Is this a one-time issue or recurring pattern?
[Assessment of frequency]

### What category does this fall under?
[ ] Missing trigger/activation
[ ] Incomplete instructions
[ ] Missing edge case handling
[ ] Wrong assumption
[ ] Missing coordination with other skill
[ ] Outdated information
[ ] New requirement
```

### Phase 3: Skill Update

#### 3.1 Determine Update Type

```
IF lesson is about trigger/activation:
  → Update skill description with new keywords
  → Add to "When to use this skill" section

IF lesson is about incomplete execution:
  → Add missing step to workflow
  → Add edge case handling
  → Update decision tree

IF lesson is about coordination:
  → Update dependencies section
  → Add cross-reference to other skill
  → Update interaction matrix

IF lesson is about new pattern/requirement:
  → Add to best practices
  → Add example
  → Update templates
```

#### 3.2 Skill Update Template

When updating a skill, add the following section at the end:

```markdown
## Evolution Log

This section tracks improvements made based on real-world usage feedback.

### [YYYY-MM-DD] Improvement: [Short Title]

**Issue:** [What went wrong]

**User Feedback:** [What the user reported]

**Root Cause:** [Why it happened]

**Fix Applied:**
- [Specific change made to the skill]
- [Another change if applicable]

**Impact:** [How this prevents recurrence]

---

[Previous entries...]
```

#### 3.3 Update Process

```typescript
// Pseudo-code for skill update process

async function updateSkill(skillName: string, lesson: Record<string, any>): Promise<string> {
  const skillPath = `.agents/skills/${skillName}/SKILL.md`;
  
  // 1. Read current skill content
  const currentContent = await readSkill(skillPath);
  
  // 2. Determine where to add the update
  if (lesson.type === "trigger") {
    // Update description and/or "When to use" section
    updateDescription(currentContent, lesson.fix);
  } else if (lesson.type === "workflow") {
    // Add step to workflow or edge case handling
    addToWorkflow(currentContent, lesson.fix);
  } else if (lesson.type === "coordination") {
    // Update dependencies and cross-references
    updateDependencies(currentContent, lesson.fix);
  }
  
  // 3. Add evolution log entry
  addEvolutionLog(currentContent, lesson);
  
  // 4. Write updated content
  await writeSkill(skillPath, currentContent);
  
  return `Skill ${skillName} updated successfully`;
}
```

### Phase 4: Verification

#### 4.1 Verify the Update

After updating, verify:

```markdown
## Update Verification Checklist

- [ ] The new information is clearly stated
- [ ] The update doesn't conflict with existing content
- [ ] The evolution log entry is complete
- [ ] The skill still follows Antigravity format
- [ ] Cross-references to other skills are valid (if applicable)
- [ ] The fix directly addresses the root cause
```

#### 4.2 Confirm with User

```
✅ SKILL UPDATE PROPOSED

Based on your feedback, I've identified the following improvement:

**Skill:** [skill name]
**Issue:** [what went wrong]
**Proposed Fix:** [what will be added/changed]

This update will:
- [Benefit 1]
- [Benefit 2]

Do you want me to apply this update?
- ✅ Yes, apply the update
- 🔄 Modify the proposed fix
- ❌ Don't update (issue was unique/not worth tracking)
```

### Phase 5: Cross-Skill Impact

#### 5.1 Check for Related Skills

Sometimes a lesson affects multiple skills:

```
IF issue involved multiple skills:
  → Check if other skills need similar updates
  → Update interaction matrix in epiroc-ecosystem
  → Ensure consistent messaging across skills

- IF issue revealed coordination gap:
  → Update both skills' dependency sections
  → Add explicit handoff instructions
  → Update epiroc-ecosystem interaction rules

#### 5.2 Mandatory Orchestrator Sync (NEW)
Any update to a core coding, QA, or branding standard in a child skill **MUST** be mirrored in:
1. **epiroc-ecosystem**: Update Interaction Matrix and coordination rules.
2. **rules.md**: Update global agent rules to enforce the new standard.
3. **walkthrough.md**: Document the cross-skill propagation.

Failure to sync will result in inconsistent agent behavior and "stale" orchestration.
```

## Common Update Patterns

### Pattern 1: Missing Trigger Keywords

```markdown
# BEFORE (in description)
description: Creates and maintains reusable UI components for Epiroc React applications.

# AFTER (added trigger keywords)
description: Creates and maintains reusable UI components for Epiroc React applications. Use when creating buttons, cards, modals, dropdowns, inputs, tables, steppers, or any reusable UI element. Trigger keywords: component, button, card, modal, input, table, dropdown, stepper, reusable
```

### Pattern 2: Missing Edge Case

```markdown
# ADD to "How to use it" section

### Edge Case: [Scenario Name]

When [specific condition], follow these steps:
1. [Step 1]
2. [Step 2]
3. [Step 3]

This handles the case where [explanation of why this edge case exists].
```

### Pattern 3: Missing Coordination

```markdown
# ADD to dependencies section

### Coordination with [Other Skill]

When [specific scenario], you MUST:
1. First consult [other skill] for [purpose]
2. Then apply [this skill's] logic
3. Finally verify with [other skill] for consistency

Failure to coordinate will result in [specific issue].
```

### Pattern 4: Clarifying Ambiguity

```markdown
# ADD clarification

### Important Note: [Topic]

[Previous ambiguous instruction] means specifically:
- [Clarification point 1]
- [Clarification point 2]

DO NOT interpret this as [common misinterpretation].
```

## Evolution Tracking

### Skill Health Metrics

Each skill tracks its evolution:

```markdown
## Evolution Statistics

| Metric | Value |
|--------|-------|
| Total Updates | X |
| Last Updated | YYYY-MM-DD |
| Common Issues | [list] |
| Trigger Accuracy | High/Medium/Low |

### Update History Summary

| Date | Issue Type | Fix Applied |
|------|------------|-------------|
| YYYY-MM-DD | Missing trigger | Added keywords for X |
| YYYY-MM-DD | Edge case | Added handling for Y |
| YYYY-MM-DD | Coordination | Added cross-reference to Z |
```

## Decision Tree

```
When user indicates skill failure:
  → What type of failure?
    ├── Skill didn't activate
    │   └── Update description with trigger keywords
    ├── Skill activated but incomplete
    │   └── Add missing steps to workflow
    ├── Skill produced wrong output
    │   └── Fix logic, add validation
    └── Skills didn't coordinate
        └── Update cross-references and handoffs

When analyzing feedback:
  → Is this a one-time issue?
    ├── Yes → Document but don't update skill
    └── No → Apply update process

When applying update:
  → Does this affect multiple skills?
    ├── Yes → Update all affected skills
    │        → Update epiroc-ecosystem
    └── No → Update single skill
```

## Example: Evolution in Action

### Scenario
User says: "The button you created doesn't have the right colors"

### Analysis
```markdown
**Issue:** epiroc-components created a button but didn't apply correct colors
**Skills Involved:** epiroc-components (created button), epiroc-ui (owns colors)
**Root Cause:** epiroc-components doesn't explicitly check with epiroc-ui for color classes
**Type:** Coordination gap
```

### Update Applied to epiroc-components

```markdown
## Evolution Log

This section tracks improvements made based on real-world usage feedback.

### [2026-04-30] Improvement: Global Efficiency & Reliability Update

**Issue:** User identified the need for stricter thinking, simplicity, and surgical change rules to avoid over-engineering and drive-by regressions.

**User Feedback:** "Perfecto. Aquí tienes las reglas para tu agente, refinadas y con un formato claro..."

**Root Cause:** The previous rules lacked quantitative efficiency constraints (500 lines rule) and a formal bug-fixing cycle.

**Fix Applied:**
- Orchestrated a global update across `rules.md`, `epiroc-coding`, `epiroc-debugging`, and `epiroc-qa`.
- Integrated **Think Before Coding**, **Simplicity First**, **Surgical Changes**, and **Execution by Objectives** as core standards.

**Impact:** Mandates a more disciplined, evidence-based coding and debugging approach across the entire ecosystem.

---

### [2026-04-24] Improvement: Global Background Process Hygiene Standards

**Issue:** Recurring leakage of background processes across all tasks, despite partial instructions in specific skills.

**User Feedback:** "porque no se sigue la regla de no dejar corriendo servicios en segundo plano? corre la skill para solucionar este porblema porque sucede demaciado a menudo"

**Root Cause:** Lack of a global, mandatory rule in `rules.md` and inconsistent enforcement in the `epiroc-qa` and `epiroc-debugging` workflows.

**Fix Applied:**
- Orchestrated a global update across `rules.md` (Rule 10), `epiroc-qa`, and `epiroc-debugging`.
- Mandated **Process Hygiene** as a blocking step for task finalization.
- Integrated "Kill-Before-Start" logic to prevent port conflicts.

**Impact:** Standardizes clean development practices and ensures that no agent activity leaves side effects in the user's terminal.

---

### [2026-04-09] Improvement: Auto-Propagation to Orchestrator

**Issue:** Updating a child skill (e.g., coding standards) without reflecting it in the `epiroc-ecosystem` or `rules.md` led to inconsistencies in agent behavior and enforcement.

**User Feedback:** "modifica tambien rules.md y ecosystem. la skill de review deberia ahcerlo de manera automatica. cualquier cambio en una skill hija debe ser modificada en la orquestadora ( ecosystem) y en las reglas para obligar al agente a usarlas"

**Root Cause:** The review skill lacked an explicit requirement to sync changes vertically to the orchestrator levels.

**Fix Applied:**
- Added **Mandatory Orchestrator Sync** to Phase 5.
- Mandated updates to `epiroc-ecosystem` and `rules.md` for any core standard change.

**Impact:** Ensures that any local skill evolution is immediately globally enforced and orchestrated correctly.

---

### [2026-04-02] Improvement: Color Coordination for Buttons

**Issue:** Buttons were created without proper Epiroc color classes

**User Feedback:** "The button you created doesn't have the right colors"

**Root Cause:** epiroc-components skill created buttons without explicitly referencing epiroc-ui color standards

**Fix Applied:**
- Added mandatory step: "Before finalizing any component, verify color classes with epiroc-ui"
- Added explicit color class names to button component templates
- Updated component creation checklist to include color verification

**Impact:** All future button components will use correct Epiroc colors by default

---
```

### Update Applied to Button Template (in epiroc-components)

```tsx
// BEFORE
export function EpirocBtnPrimary({ children }: { children: React.ReactNode }) {
  return <button className="btn-primary">{children}</button>;
}

// AFTER (with explicit Tailwind CSS classes aligned with epiroc-ui)
interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export function EpirocBtnPrimary({ children, ...props }: Props) {
  return (
    <button
      {...props}
      className="bg-epiroc-yellow text-epiroc-dark-blue hover:bg-epiroc-dark-yellow px-4 py-2 font-semibold transition-all focus-visible:ring-2 focus-visible:ring-epiroc-yellow"
    >
      {children}
    </button>
  );
}
```

## Best Practices

1. **Always Get User Confirmation**: Before applying updates, confirm with the user
2. **Document Everything**: Every update goes in the Evolution Log
3. **Be Specific**: Updates should directly address the root cause
4. **Check Cross-Impact**: Consider if update affects other skills
5. **Keep It Maintainable**: Don't bloat skills with rare edge cases
6. **Track Patterns**: Multiple similar issues = need for broader fix
7. **Preserve Intent**: Updates should enhance, not change the skill's purpose
8. **Version Thoughtfully**: Major changes might need skill versioning

## Integration with Debugging

When **epiroc-debugging** identifies that a bug was caused by a skill gap:

```
epiroc-debugging identifies: "Root cause is missing validation in epiroc-components"
    ↓
epiroc-review is invoked
    ↓
Analyzes the pattern
    ↓
Updates epiroc-components with validation step
    ↓
Adds to evolution log
    ↓
Future executions include the fix
```
