# Skill Creation SOP (Standard Operating Procedure)

## Purpose
This SOP documents the workflow for creating new Claude Skills based on successful collaboration patterns. Use this as a template when initiating new skill creation discussions.

---

## Workflow Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  Step 1          Step 2          Step 3          Step 4         │
│  Define Goal  →  Design Flow  →  Implement  →   Test & Refine  │
│                                                                 │
│  ~5 min          ~10 min         varies         ~10-15 min      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Step 1: Define Goal (5 min)

**Questions to answer:**
1. What problem does this skill solve?
2. What inputs does it need?
3. What outputs should it produce?
4. What are the success criteria?

**Template:**
```
Task: [One-sentence description]

Input Parameters:
- parameter_name: type, required?, default

Success Criteria:
- [Specific, measurable outcomes]

Out of Scope:
- [What this skill should NOT do]
```

**Example from xiaohongshu-author-finder:**
```
Task: Automate finding and following Xiaohongshu authors by topic

Input Parameters:
- topic: string, required
- minLikes: number, optional, default 50
- maxFollowers: number, optional, default 1000
- maxNotes: number, optional, default 50

Success Criteria:
- Find notes matching topic
- Filter by likes >= minLikes
- Filter by followers <= maxFollowers
- Follow qualifying authors
- Record results with links and metrics

Out of Scope:
- Posting content
- Sending messages
- Commenting
```

---

## Step 2: Design Flow (10 min)

**Key design decisions:**

### 2.1 Workflow Phases
Define the logical phases of execution:
1. **Initialize**: Set up state, navigate to starting point
2. **Search/Discover**: Find relevant content
3. **Validate**: Check quality/filter criteria
4. **Action**: Perform the main operation
5. **Record/Output**: Store results
6. **Complete**: Summarize and return

### 2.2 Error Handling Strategy
Choose based on skill complexity:

| Level | Trigger | Response |
|-------|---------|----------|
| **Structural** | Element not found (page changed) | Try fallback selectors, continue |
| **Navigation** | Page fails to load | Retry 2x, then continue |
| **Business** | Criteria not met | Skip and log, continue |
| **Critical** | Authentication required | Stop and report |

### 2.3 State Management
Decide on state scope:

| Type | Scope | Use Case |
|------|-------|----------|
| **Session Set** | Current run only | Deduplication (recommended default) |
| **File-based** | Persistent across runs | User preferences, caches |
| **None** | Stateless | Pure transformations |

**Recommendation**: Start with Session Set for deduplication. Add persistence only when explicitly needed.

### 2.4 Token Optimization
Design to reduce token consumption:
- Only trigger error handlers when errors occur
- Use early returns for obvious "not match" cases
- Skip already-processed items via Set
- Conditional loading of reference docs

---

## Step 3: Implement (Varies)

### 3.1 File Structure
```
skills/
└── [skill-name]/
    └── SKILL.md
```

### 3.2 SKILL.md Template

```markdown
---
name: [skill-name-in-kebab-case]
description: "Comprehensive [domain] skill for [use cases].
When Claude needs to: (1) [action 1], (2) [action 2], (3) [action 3].
Use for [specific scenarios]. NOT for: [out of scope]"
---

# Skill Name

## Overview
Brief description of what this skill does.

## Input Parameters
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|

## Workflow
### Phase 1: [Name]
[Description and steps]

### Phase 2: [Name]
...

## Error Handling
### Structural Changes
[When and how to handle]

### Navigation Errors
[Retry strategy]

## Output Format
```json
{
  // Expected output structure
}
```

## Limitations
- [Limitation 1]
- [Limitation 2]

## Examples
**Basic:**
```
[example command]
```

**Advanced:**
```
[example with parameters]
```
```

---

## Step 4: Test & Refine (10-15 min)

### 4.1 Test Coverage Matrix

| Scenario | Input | Expected | Status |
|----------|-------|----------|--------|
| Happy path | Standard params | Success | [ ] |
| Edge case | Min params | Works | [ ] |
| No matches | Obscure topic | Graceful return | [ ] |
| Structural change | Simulated failure | Fallback works | [ ] |

### 4.2 Test Execution Protocol

1. **Define test inputs** before starting
2. **Execute step-by-step** with user observation
3. **Record all outputs** in expected format
4. **Verify success criteria** met
5. **Document issues** for refinement

### 4.3 Refinement Prompts

If issues found, iterate:
```
The skill failed at [phase]. Issue: [description].
Expected: [what should happen].
Actual: [what happened].
Fix: [suggested change].
```

---

## Communication Checklist

When creating a new skill, confirm these points:

- [ ] Clear problem statement
- [ ] Input parameters defined
- [ ] Success criteria defined
- [ ] Out of scope defined
- [ ] Workflow phases designed
- [ ] Error handling strategy set
- [ ] State management decided
- [ ] Token optimization considered
- [ ] SKILL.md created
- [ ] Test executed
- [ ] Output format verified

---

## Example: xiaohongshu-author-finder

**Session Date**: 2026-01-28

| Checklist Item | Status |
|----------------|--------|
| Problem: Find Xiaohongshu authors by topic | ✓ |
| Params: topic, minLikes, maxFollowers, maxNotes | ✓ |
| Success: Followed 1 author in test | ✓ |
| Phases: 6 phases designed | ✓ |
| Error: Structural fallback implemented | ✓ |
| State: Session Set for deduplication | ✓ |
| Tokens: Skip-checked authors, early returns | ✓ |
| SKILL.md: 5693 bytes | ✓ |
| Test: Full workflow executed | ✓ |
| Output: JSON with summary and results | ✓ |

---

## Quick Start Template

For new skill discussions, start with:

```
## New Skill Request

**Skill Name:** [name]

**Purpose:** [1-2 sentences]

**Inputs:**
- param1: [type], [required?], [default]
- param2: ...

**Expected Output:**

**Related Skills:** [if any]

**Priority:**
- [ ] High - needed now
- [ ] Medium - useful
- [ ] Low - nice to have
```

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-28 | - | Initial SOP based on xiaohongshu-author-finder creation |

---

*This SOP is a living document. Update as new patterns emerge from skill creation experiences.*
