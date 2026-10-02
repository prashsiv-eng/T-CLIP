# Requirements — T-CLIP Checklist Compliance (Phase 1)

## Overview

T-CLIP (Traceable Compliance & Integration for Pre-release) is a browser-based tool that helps teams create, manage, and attest compliance checklists for project releases (Security, GxP, QA, Change Management, etc.).

**Phase 1:** Fully client-side. No backend, no authentication, no external network calls after initial page load.

**Phase 2 (future):** Enterprise version with backend, database, and identity provider. Out of scope here.

---

## Core Concepts

**One view, role-controlled.** There is no separate "authoring mode" vs "review mode". There is one checklist view. What a user can see and do is determined entirely by their capability level, which is resolved from their role at runtime.

**Capability levels** (ascending privilege):
- `observer` — read-only. Sees all fields and history. Cannot change anything.
- `full` — can fill response fields and set item status on items permitted to them.
- `approver` — same as `full`, plus can confirm or override another actor's response.
- `editor` — same as `approver`, plus can edit checklist structure (items, field schema, metadata, assignments).

**Template rules.** The checklist file defines who can do what — minimum capability required for structural editing, status changes, field editing, field visibility. Rules restrict capability; they never grant more than the user's resolved level.

---

## Users

| Role (example) | Typical capability |
|---|---|
| Project Owner, Admin | `editor` |
| GxP Reviewer, Security Lead | `full` |
| Release Approver, QA Approver | `approver` |
| Auditor, Observer | `observer` |

Role names are free text. Capability is resolved by matching the role name against a configurable pattern map.

---

## REQ-1 — Home Screen

**Acceptance criteria:**
1. The home screen is the entry point to the entire application.
2. It contains a **persona selector**: name (required, free text) and role (required, free text with suggested values). Identity must be set before New or Open can be used.
3. It presents two actions: **New** (create a checklist from a template) and **Open** (load an existing `checklist.json`).
4. The persona selector on the home screen pre-fills from `localStorage` on subsequent visits.
5. A template preview is accessible from the home screen without opening a file.

---

## REQ-2 — New Checklist (from template)

**User story:** As a project owner, I want to create a `checklist.json` for my project by starting from a template, so I don't have to define fields, categories, and rules from scratch.

**Acceptance criteria:**
1. Selecting **New** presents a template chooser with two options:
   - **Built-in templates**: shipped with the app — at minimum: "GxP Release", "Security Review", "Standard Change Management", "Combined Release".
   - **Import a template**: upload any valid `checklist.json` to use as the starting structure.
2. Each built-in template can be previewed (read-only) before selecting.
3. After choosing a template, the user fills in mandatory project metadata: `project` (name), `version`, `branch`. These are required before the file can be exported.
4. After metadata entry, the user lands in the **checklist view** with their identity already set. If their capability is `editor`, structural editing controls are visible.
5. The user exports the completed checklist as `checklist.json` via a browser download. This file is then committed to the repo manually. T-CLIP does not interact with git.

---

## REQ-3 — Open Checklist

**User story:** As a reviewer, I want to load an existing `checklist.json` and respond to my assigned items.

**Acceptance criteria:**
1. Selecting **Open** presents a drag-and-drop zone and a file picker accepting `.json` files.
2. The app validates the file on load. If validation fails, a specific error is shown and the file is not loaded.
3. On successful load, if `localStorage` contains saved review state for this file (matched by SHA-256 hash), it is automatically restored and a non-blocking notice is shown.
4. The user lands in the checklist view with their identity already set from the home screen.

---

## REQ-4 — Persistent Identity Selector

**User story:** As a user, I want to be able to see and change my identity at any time while working, so I can switch roles without going back to the home screen.

**Acceptance criteria:**
1. The header always shows the current user's name and role while a file is open.
2. Clicking the identity area in the header opens a compact identity panel (name + role fields) inline or as a popover.
3. Changing identity takes effect immediately — the checklist view re-renders with the new capability applied.
4. Identity changes are persisted to `localStorage`.

---

## REQ-5 — Checklist View

**User story:** As a user, I want to see all checklist items grouped by category with my assigned items clearly indicated.

**Acceptance criteria:**
1. Items are grouped by `category` in collapsible sections.
2. Items assigned to the current user (by name or role match) are visually highlighted.
3. Each item shows: ID, description, current status (with color + icon), last actor name + role, and assignment.
4. The header shows: project name, version, branch, current user name + role badge.
5. The header is sticky (always visible while scrolling).
6. A tab bar below the header switches between **Checklist** and **Dashboard** views.

---

## REQ-6 — Item Response (Dynamic Fields)

**User story:** As a reviewer, I want to respond to each checklist item using exactly the fields the template defines, with the app enforcing who can fill what.

**Acceptance criteria:**
1. The **status** control (`pass` / `fail` / `na`) is always present and is not part of the dynamic field schema.
2. Each item's response form is driven by the `fields` schema in the file. The app renders whatever fields are defined — no hardcoded field names in the app.
3. Supported field types: `text`, `textarea`, `select` (fixed options), `url` (validated), `boolean` (yes/no), `date`. Unknown types fall back to `textarea`.
4. Each field can declare `requiredWhen`: statuses that make it mandatory. Fields not required for the current status are collapsed but accessible.
5. Each field can declare `editableBy`: minimum capability level required to fill it. A user below that level sees the field read-only.
6. Each field can declare `visibleTo`: minimum capability level required to see it. A user below that level does not see the field at all.
7. If an item has a `fields` override list, only those fields appear for that item. Otherwise all top-level schema fields apply.
8. Pre-filled `values` from the file appear as initial values; users with sufficient capability can update them.
9. Items can declare `statusEditableBy`: minimum capability required to change that item's status. A user below that level sees the status read-only.
10. On saving a response, the app records: actor name, role, status, all field values, and timestamp (ISO 8601 UTC) into the item's history.
11. An `approver`-or-above user can confirm or override another actor's response on any item they have access to.
12. The app blocks attestation export if any required item has status `pending`, or if required fields for an item's current status are empty.

---

## REQ-7 — Structural Editing (editor capability)

**User story:** As a project owner, I want to edit the checklist structure — items, field schema, assignments, metadata — within the same view I use for reviewing.

**Acceptance criteria:**
1. Structural editing controls are only visible to users with `editor` capability (or above the `structureEditableBy` minimum set in the file's rules).
2. An `editor` can: add, edit, and delete items; reorder items within a category via drag-and-drop; add, edit, and delete field schema entries; edit project metadata (name, version, branch); edit item assignments.
3. An `editor` can also set pre-filled `values` on items (e.g., fill in a ticket reference before handing off to reviewers).
4. Structural changes are reflected immediately in the view.
5. After making structural changes, the user can export an updated `checklist.json` at any time.
6. Structural edits are tracked separately from review responses — they do not appear in the item response history.

---

## REQ-8 — Template Rules

**User story:** As a project owner, I want the template to define who can do what, so that access is controlled by the file itself without any backend.

**Acceptance criteria:**
1. The checklist file can contain a top-level `rules` object defining minimum capability levels for:
   - `structureEditableBy`: minimum capability to edit the checklist structure (default: `editor`).
   - `enforcedAssignment`: boolean — if `true`, only the assigned role/name can respond to an item (default: `false`).
2. Each field in the schema can declare:
   - `editableBy`: minimum capability to fill/edit the field (default: `full`).
   - `visibleTo`: minimum capability to see the field (default: `observer`).
3. Each item can declare:
   - `statusEditableBy`: minimum capability to change that item's status (default: `full`).
4. Rules restrict capability only — they never grant more than the user's resolved level.
5. If a rule references an unknown capability level, it is ignored and the default applies.
6. Rule violations are shown as disabled controls with a tooltip explaining why (e.g., "Requires Approver capability").

---

## REQ-9 — Identity & Capability Resolution

**Acceptance criteria:**
1. Role is free text. Suggested values shown: "Reviewer", "Approver", "Observer", "Project Owner". User can type anything.
2. Capability is resolved by matching the role name against a configurable pattern map stored in `localStorage`:
   - Default rules: "observer" substring → `observer`; "approver" substring → `approver`; "owner" or "admin" or "editor" substring → `editor`; all others → `full`.
3. The pattern map can be edited in the Settings panel: add/remove/reorder `{ pattern, capability }` rules. First match wins; fallback is `full`.
4. Capability is re-resolved whenever the user changes their role.
5. Phase 2: identity and capability come from the authenticated user via an identity provider. The free-text entry and pattern map are replaced.

---

## REQ-10 — Session Persistence

**Acceptance criteria:**
1. After every response change, the app auto-saves the full review state to `localStorage`, keyed by the SHA-256 hash of the loaded file.
2. When a file is loaded whose hash matches a saved state, the state is automatically restored with a non-blocking notice.
3. The user can clear the saved state ("Start fresh") from the Settings panel.
4. If `localStorage` is unavailable or quota is exceeded, the app continues without persistence and shows a one-time warning. Data loss on close is acceptable in this case.

---

## REQ-11 — Dashboard

**Acceptance criteria:**
1. Accessible via a persistent tab while a file is loaded.
2. **Summary cards**: total items, pass, fail, na, pending, completion % (resolved required items / total required × 100).
3. **Pending Responses**: items with no actor response yet, grouped by category and assignee.
4. **Pending Review**: items with a response but no approver confirmation.
5. **Action Item Leaderboard**: actors ranked by outstanding unconfirmed items.
6. **Filters** (combinable, update immediately): status, category (multi-select), role (free-text substring), required-only toggle.
7. Filters persist for the session duration.

---

## REQ-12 — Attestation Export

**Acceptance criteria:**
1. Attestation exported as `checklist-attestation.json` containing: project metadata, source file SHA-256 hash, export timestamp, and for each item: final status, all field values, full action history, confirmation record.
2. A read-only summary screen is shown before export, grouping items by status and highlighting `fail` items.
3. Export button enabled only when all required items are resolved and no required fields are missing.
4. The attestation is self-describing — verifiable against the source file hash without T-CLIP.

---

## REQ-13 — Checklist File Format

```json
{
  "version": "1.0",
  "project": "MyApp",
  "branch": "pre-dev",
  "rules": {
    "structureEditableBy": "editor",
    "enforcedAssignment": false
  },
  "fields": [
    {
      "id": "evidence",
      "label": "Evidence",
      "type": "textarea",
      "requiredWhen": ["fail"],
      "editableBy": "full",
      "visibleTo": "observer",
      "maxLength": 1000
    },
    {
      "id": "approval_decision",
      "label": "Approval Decision",
      "type": "select",
      "options": ["Approved", "Conditionally Approved", "Rejected"],
      "requiredWhen": ["pass", "fail"],
      "editableBy": "approver",
      "visibleTo": "full"
    }
  ],
  "items": [
    {
      "id": "SEC-001",
      "category": "Security",
      "description": "SAST scan passed with no critical findings",
      "status": "pending",
      "required": true,
      "assignedTo": { "role": "Security Lead" },
      "statusEditableBy": "full"
    },
    {
      "id": "GXP-001",
      "category": "GxP",
      "description": "Change control record created and approved",
      "status": "pending",
      "required": true,
      "assignedTo": { "role": "GxP Approver", "name": "Jane Smith" },
      "statusEditableBy": "approver",
      "fields": ["evidence", "approval_decision"],
      "values": { "evidence": "https://jira.example.com/CHG-4421" }
    }
  ]
}
```

Unknown properties at any level are ignored (forward compatibility). Missing optional properties use their documented defaults.

---

## REQ-14 — Accessibility & Usability

**Acceptance criteria:**
1. All interactive controls are keyboard-accessible.
2. Status indicators use color + icon + text — never color alone.
3. Usable on screen widths 1024 px–1920 px.
4. An invalid or empty file never causes a blank screen or unhandled exception.
5. Disabled controls show a tooltip explaining the reason (e.g., "Requires Approver capability").
6. Works from `file://` or any static HTTP server with no API dependencies.

---

## Out of Scope (Phase 1)

- Backend, database, or server-side persistence.
- User authentication or identity provider integration.
- GitHub/GitLab API integration (no PR detection, auto-load, or write-back).
- External notifications (email, Slack, etc.).
- Simultaneous multi-user sessions on the same browser instance.
- All Phase 2 functionality.
