---
name: epiroc-debugging
description: Provides systematic debugging workflows for Epiroc Node.js and TypeScript applications. Follows best practices to identify, isolate, and fix issues. Handles cleanup of test files and temporary resources. Requires user verification before marking issues as resolved. Manages file cleanup after refactoring or feature changes.
---

# Epiroc Debugging Skill

Provides systematic debugging workflows and cleanup procedures for Epiroc Node.js and TypeScript applications, ensuring issues are properly identified, resolved, and verified.

## When to use this skill

- **CRITICAL**: An error, Stack Trace, or Exception is provided in the chat.
- Code is not behaving as expected
- Frontend React component or hooks are throwing errors or warning messages
- Express server route or controller fails or crashes
- Cleaning up after testing or development
- Removing deprecated or unused files
- Verifying fixes are complete
- Trigger keywords: debug, error, bug, fix, issue, broken, not working, cleanup, test files, delete, Stack Trace, Exception, TypeError, ReferenceError, compile error, TypeScript error, console log

### MANDATORY RULES
- **Immediate Activation**: If the user provides a code stack trace or an error log, you **MUST** immediately activate this skill before attempting any other code changes. **DO NOT** skip to proposing a fix without explicitly mentioning that you are activating the debugging workflow.
- **Mandatory Acknowledgment**: You must acknowledge the error and state that you are entering "Debugging Mode" following the `epiroc-debugging` protocol.
- **Root Cause Isolation**: Do not propose a fix without first identifying the exact line and file where the error originated.
- **Execution by Objectives**: Follow the strict cycle: 1. Write failing test or establish reproduction, 2. Verify failure, 3. Fix with minimum change, 4. Verify pass.
- **Surgical Fixes**: Touches only what is necessary to fix the bug. No drive-by refactors.
- **Zero Junk Policy**: You MUST delete any temporary test/debug files after the fix is verified.

## Dependencies

This skill coordinates with:
- **epiroc-coding**: For TypeScript code standards during fixes
- **epiroc-ux**: For client layout-related issues
- **epiroc-ui**: For Tailwind/CSS-related issues
- **epiroc-components**: For React component-specific debugging

## Debugging Workflow

### Phase 1: Identify

#### 1.1 Gather Information

```markdown
## Bug Report Template

### What happened?
[Describe the observed behavior]

### What should have happened?
[Describe the expected behavior]

### Steps to Reproduce
1. Go to page/component '...'
2. Interact with '...'
3. See error

### Environment
- Browser: [Chrome/Firefox/Safari]
- Role: [Admin/User/Guest]

### Error Messages
```
[Paste Express terminal errors or React browser console logs]
```
```

#### 1.2 Check Logs
- **Local Server-side**: inspect server console logs or output from `npm run dev`.
- **Local Client-side**: inspect the Chrome/browser DevTools console.
- **Production / Cloud (Databricks Apps)**: To inspect production logs from the active Databricks App container, run:
  ```bash
  databricks apps logs logistech --profile DEFAULT --tail-lines 100
  ```
  *(Nota: El parámetro `--profile DEFAULT` es obligatorio para evitar errores de autenticación ambigua si existen múltiples perfiles en la máquina).*

### Phase 2: Diagnose

#### 2.1 Common Issue Categories

| Category | Symptoms | Investigation Steps |
|----------|----------|---------------------|
| **React Component / Hook Issues** | Render errors, infinite re-renders, state mismatches | Check `useEffect` dependency arrays, React state updates, and props |
| **API Route / Express Issues** | 404, 500 Server Errors, database fetch failures | Check Express route registration, async/await handling, and DuckDB queries |
| **TypeScript / Type Issues** | Compilation errors, missing parameters, wrong type | Check interfaces, type declarations, cast operators, and imports |
| **CSS / Styling Issues** | Layout breaks, incorrect colors, responsive issues | Check Tailwind class assignments, CSS overrides |

#### 2.2 TypeScript & Express-Specific Debugging

**API Route Mismatch or Failure:**

```typescript
// Add debug console logging to trace router flow
router.get('/tickets/:id', async (req: Request, res: Response, next: NextFunction) => {
  console.log(`[DEBUG] GET /tickets triggered with ID: ${req.params.id}`);
  try {
    const ticket = await TicketService.getById(Number(req.params.id));
    if (!ticket) {
      console.log(`[DEBUG] Ticket ${req.params.id} not found in DB`);
      return res.status(404).json({ error: 'Ticket not found' });
    }
    return res.json(ticket);
  } catch (err) {
    console.error(`[ERROR] GET /tickets failed:`, err);
    next(err);
  }
});
```

### Phase 3: Fix

#### 3.1 Fix Implementation Guidelines

**Execution by Objectives (STRICT CYCLE):**
1. **Escribe el test / paso de reproducción** que reproduce el bug.
2. **Verifica que el error se produce** (confirmando el bug).
3. **Arregla el bug** con el mínimo cambio necesario (**Cambio Quirúrgico**).
4. **Verifica que pasa** (confirmando la solución).

**DO:**
- ✅ Make minimal, targeted changes (Surgical)
- ✅ Document the fix in code comments
- ✅ Keep changes reversible

**DON'T:**
- ❌ Make large refactoring changes during bug fix
- ❌ Change unrelated code (Drive-by formatting)
- ❌ Skip running lint checks (`npx eslint <file> --fix`)

### Phase 4: Verify

#### 4.1 Verification Checklist

- [ ] Fix addresses root cause, not just symptom
- [ ] No new compiler warnings or TypeScript errors introduced
- [ ] Code follows `epiroc-coding` TS standards
- [ ] **Standard Compliance**: Run ESLint and Prettier formatting on fixed files
- [ ] Original issue is resolved completely

### Phase 5: Mandatory Cleanup & Zero Junk Policy

After completing debugging or verification, the agent **MUST** remove all temporary test files, debugging scripts, and non-production artifacts.

- **Prefixing Temporary Files**: Any temporary, mock, test, or debugging file created during debugging or feature testing MUST be prefixed with `eliminar_` (e.g., `eliminar_test_api.ts`). This is a mandatory safety prefix to help automate and visual-check that no test artifacts are deployed to production.
- **Console Log Cleanup**: While using `console.log` is fully acceptable for troubleshooting issues, all such temporary print statements MUST be cleaned up and removed before task completion. Unsupervised logs must not reach production files because they clutter the backend logs.

**Background Process Cleanup**: Any dev server started in the background MUST be terminated using `send_command_input(Terminate=True)` before the turn is finalized.

```typescript
// mandatory files to remove after task completion
const cleanupTargets = [
  "test_debug.ts",
  "temp_*.ts",
  "qa_test_plan.md", // once verified
  "*_debug.log",
];
```

## Best Practices

1. **Reproduce First**: Always reproduce the issue before fixing.
2. **Root Cause**: Fix the root cause, not just the symptom.
3. **Minimal Changes**: Make the smallest change that fixes the issue.
4. **Clean Up**: Remove all temporary files and code (such as temporary `console.log` statements) added during debugging. Ensure logs are kept clean and no residual print statements are left.
5. **Verify with User**: Always get user confirmation before closing.

---

### [2026-05-19] Stack Update: Full Node & TypeScript Debugging Pivot
- Completely removed Python traceback examples, `@callback` styling, and Flask logging.
- Integrated TypeScript compiler, ESLint, React hooks, and Express API debugging protocols.
