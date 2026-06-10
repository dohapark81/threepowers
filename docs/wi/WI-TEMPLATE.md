---
wi_id: WI-{YYYYMMDD}-{SEQ}
title: ""
date: ""
author: ""
status: draft          # draft | approved | in-progress | done | cancelled
priority: normal       # critical | high | normal | low

# Assignment
assignee: ""           # Agent assigned to this work
reviewer: ""           # Agent to review

# Git
base_branch: main
target_branch: develop
worktree: false        # true = work in isolated worktree

# Design doc cross-link
spec_id: ""            # Design doc API ID (e.g. MSG.LIST)
design_doc: ""
design_section: ""
screens: []            # Affected screen IDs (e.g. THDUI002)

# Dependencies
depends_on: []         # WI IDs that must complete before this starts
blocks: []             # WI IDs blocked by this WI

# Impact
risk_level: low        # low | medium | high | critical
api_changed: false     # if true, contract_type + consumers required
contract_type: none    # none | additive | breaking | deprecation
schema_changed: false  # if true, check migration needs

# Consumers (required when api_changed: true)
consumers:
  # - screen: THDUI002
  #   file: src/ui/pages/threads/ThreadDetailPage.tsx
  #   store: useThreadDetailStore
  #   component: MessageBubble

# Estimated scope (atomicity: ≤ $0.30, 1-3 files)
estimated_files: 0
estimated_cost: "$0.00"
---

# {title}

## Background (Why)

> Why this work is needed. 1-3 sentences.

## Goal (What)

> What changes when this is complete. Feature perspective.

## Scope

### Files to modify

| File | Description |
|------|-------------|
| `path/to/file.ts` | description |

**Out of scope (do not touch)**

- list items

## Impact Analysis

### Design doc cross-link

> Summary of the relevant design doc section.

```bash
npx doc section {design_doc} "{spec_id}"
```

| Item | Value |
|------|-------|
| API ID | `{spec_id}` |
| Screen ID | `{screens}` |
| Section | `{design_section}` |

### API / Type changes

> Skip this section if `api_changed: false`.

| Changed item | contract_type | Consumers (screen / file / store) |
|-------------|--------------|-----------------------------------|
| (none) | - | - |

### Consumer impact checklist

> Required when `api_changed: true`. Empty = cannot approve.

- [ ] Affected screen IDs identified (`screens` field)
- [ ] Affected frontend components identified (`consumers.component`)
- [ ] Affected stores identified (`consumers.store`)
- [ ] If `contract_type: breaking`, issue separate consumer WI (add to `blocks`)
- [ ] DB schema change migration: (none / Phase N needed)

### Side-effect risk areas

> Areas that broke in similar past work. "None" if none.

### risk_level criteria

| Level | Condition |
|-------|-----------|
| `low` | Single file, no API change, existing tests sufficient |
| `medium` | 2-3 files, API change with ≤ 1 consumer |
| `high` | API change + 2+ consumers, or store refactoring |
| `critical` | DB schema change, or core SDK interface change |

> `high` or above: consult lead before implementation.

---

## Implementation Guide (How)

> Concrete instructions an agent can follow without judgment calls.
> Include code examples, type definitions, caveats.

```typescript
// Example code (if applicable)
```

## Acceptance Criteria (AC)

> All must pass to mark "done". If any fails, STOP and report.

- [ ] `npx tsc --noEmit` passes
- [ ] `npx vitest run src/server/` passes (backend work)
- [ ] `npx vitest run src/ui/` passes (frontend work)
- [ ] (add feature-specific AC)

## Completion Report Format

```
## Completion Report

### Modified files
- path/to/file.ts (+N/-M)

### tsc result
Pass / Fail

### Test result
N tests passed

### Remaining items
None / (list if any)
```
