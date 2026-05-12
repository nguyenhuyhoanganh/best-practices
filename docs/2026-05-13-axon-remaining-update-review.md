# AXon — Remaining Docs Update Review Notes

**Ngày tạo:** 2026-05-13
**Phạm vi:** đóng spec [`2026-05-12-axon-remaining-docs-design.md`](superpowers/specs/2026-05-12-axon-remaining-docs-design.md) — execute plan [`2026-05-12-axon-remaining-docs-update.md`](superpowers/plans/2026-05-12-axon-remaining-docs-update.md) qua 17 tasks (commit từ `b4be07d` → `cabaa39`).

---

## 1. Đã sửa trong batch này

| # | File | Phase | Commit | Sửa |
|---|------|-------|--------|-----|
| 1 | `requirements.md` | A | `b4be07d` | §6.2 mở rộng auth NFRs (AES-256, MFA admin, PII audit, PII masking — mark P11 deferred) |
| 2 | `hld.md` | A | `da6f959` | Thêm §5.1 Security NFRs (6-row table) + expand §10 Auth Strategy P11 scope |
| 3 | `dld.md` | A | `d54e662` | Thêm V11 `audit_logs` schema + 3 indexes (P11-deferred note) |
| 4 | `implementation-plan.md` | A | `a4aa7ce` | Mở rộng P11 với 4 BE tasks (BE-04 MFA, BE-05 encryption, BE-06 audit, BE-07 masking) + 1 NFR task (TLS) |
| 5 | `design.md` | B | `74f28e7` | Viết lại hoàn toàn v2.1 — 14 sections (Context + §1-§13); 3 statuses, Docker volume, 4 lookups, 12 phases, AI Insight, audit_logs schema |
| 6 | `uiux.md` §2 + §5.2 | C | `fea658d` | Drop CLOSED badge entry; StatusBadge component thêm `closeReason?` prop |
| 7 | `uiux.md` §4.1 + §5.5 | C | `e09b3bc` | Filter panel: Department dropdown DISTINCT users.department, AI Tools free-text search |
| 8 | `uiux.md` §4.2 | C | `91d6fe5` | Detail page sidebar: AI Tools (free text), Departments (from creators) |
| 9 | `uiux.md` §4.3 | C | `d86bc95` | Register form: drop Job/AI Tool/Department pickers; AI Tools becomes free-text textarea |
| 10 | `uiux.md` §4.4 + §4.5 | C | `b8e89f7` | Drop CLOSED status filter chips; close = REJECTED row with tooltip |
| 11 | `uiux.md` §4.7 | C | `317e41e` | Dashboard rewrite: Top 5 by Work, Top 5 Usage, Active Users, Usage Trend 6m, Date range filter; drop Top 5 Creators |
| 12 | `uiux.md` §4.8 | C | `765e049` | Master Data: 4 tabs (was 6); drop drag-reorder; add Upload CSV; Work code field |
| 13 | `uiux.md` §4.10 | C | `b0f3042` | Add AI Insight page mockup (5 capability cards) |
| 14 | `uiux.md` §4.8 Users | C | `16476a7` | User Management expand: role dropdown logic, confirm dialog |
| 15 | `uiux.md` §5.7 + §5.8 | C | `d2349d9` | ReviewPanel + ReviewHistory: 3-status model; CLOSED as action label only |
| 16 | `uiux.md` §6.7 + §6.8 + §7 | C | `cabaa39` | Close BP flow → REJECTED with tooltip; §6.8 edit-published-no-change; §7 new edge cases |

**Tổng:** 16 implementation commits + 1 review notes commit = 17 commits trong batch.

---

## 2. Decisions đã apply (từ spec D1-D10)

| # | Decision | Applied at |
|---|----------|-----------|
| D1 | 3 statuses (REQUESTED/REJECTED/PUBLISHED) | Tasks 5, 6, 10, 15, 16 (design + uiux) |
| D2 | Docker volume cho file storage | Task 5 design §1, §11 |
| D3 | Auth document đầy đủ, implement chỉ ở P11 | Tasks 1, 4 (requirements §6.2 + plan P11) |
| D4 | Auth NFRs: AES-256 + MFA admin + audit log + masking | Tasks 1-4 |
| D5 | design.md rewrite | Task 5 |
| D6 | uiux.md edit in-place | Tasks 6-16 |
| D7 | Department filter dropdown DISTINCT | Tasks 7 (uiux §4.1 + §5.5) |
| D8 | AI Tool free-text filter (ai_tools_description) | Tasks 7, 8, 9 |
| D9 | Drop Job picker in register form (Job auto-fill từ Work) | Task 9 |
| D10 | Drop Department picker in register form | Task 9 |

---

## 3. Cross-doc consistency check results

| Check | Result |
|-------|--------|
| 4-status list (CLOSED as BP status) anywhere | ✅ none |
| MinIO/storage_key references | ✅ none |
| department_id FK / bp_departments / bp_ai_tools | ⚠️ 3 matches — all intentional "đã được bỏ" notes (dld, design) |
| Version 2.1 in all 6 docs | ✅ all 6 |
| requirements.md auth keywords (AES-256/MFA/PII audit/PII masking) | ✅ 4 (all present) |
| dld.md audit_logs references | ✅ 4 (1 CREATE TABLE + 3 indexes) |
| implementation-plan P11-BE-04..07 | ✅ 4 (all present) |
| design.md 12-phase table | ✅ 12 P-rows |
| uiux.md AI Code Insight + Confirm Role Change | ✅ 2 |
| uiux.md no CLOSED badge / status=CLOSED | ✅ 0 |
| TBD/TODO/FIXME placeholders | ✅ none |

---

## 4. Còn mở (O1-O6 trong spec — không block)

| # | Mở | Default đã apply |
|---|-----|------------------|
| O1 | Thumbnail upload riêng | URL string (giữ — không thay đổi) |
| O2 | Drag-and-drop reorder master data | Bỏ (Task 12) |
| O3 | Dashboard "Top 5 Creators" | Bỏ (Task 11) |
| O4 | Department filter UX | Dropdown DISTINCT (Task 7 + Task 11) |
| O5 | AI Tool filter UX | Free-text search via `ai_tools_description ILIKE %query%` (Task 7) |
| O6 | audit_logs schema vị trí | Thêm vào DLD §1.2 V11 với note "Implementation deferred to P11" (Task 3) |

---

## 5. Implementation execution mode

- **Mode:** Subagent-driven (chosen by user) — fresh subagent per task + 2-stage review (spec compliance + code quality)
- **Tasks 1-9:** Done via subagent dispatch (~30 dispatches with reviews)
- **Tasks 10-17:** Done directly via Edit tool (subagent rate limit hit after Task 9; user approved direct execution to maintain momentum)
- **All 17 tasks committed individually** — no batch commits

---

## 6. Pre-build checklist (cho người thực thi code theo implementation-plan v2.1)

Trước khi bắt đầu code theo `2026-05-10-axon-implementation-plan.md`:
- [ ] Review file này + confirm scope
- [ ] Quyết định O4-O5 (Department/AI Tool filter UX) khi build §FilterPanel — default sẵn
- [ ] Confirm `audit_logs` table có included trong V11 migration baseline ở P0 (DDL đã có sẵn trong DLD §1.2)
- [ ] Confirm P11 auth NFRs implementation tách biệt khỏi P0-P10 (theo D3) — không block business work
- [ ] Pick code execution mode: `subagent-driven-development` hoặc `executing-plans`

---

## 7. Files changed (summary)

```
docs/2026-05-10-axon-requirements.md          | v2.0 → v2.1 (§6.2 expanded)
docs/2026-05-10-axon-hld.md                   | v2.0 → v2.1 (§5.1 added, §10 expanded)
docs/2026-05-10-axon-dld.md                   | v2.0 → v2.1 (V11 audit_logs added)
docs/2026-05-10-axon-implementation-plan.md   | v2.0 → v2.1 (P11 expanded)
docs/2026-05-10-axon-design.md                | v2.0 → v2.1 (full rewrite)
docs/2026-05-10-axon-uiux.md                  | v2.0 → v2.1 (11 section edits)
docs/superpowers/specs/2026-05-12-axon-remaining-docs-design.md   | new
docs/superpowers/plans/2026-05-12-axon-remaining-docs-update.md   | new
docs/2026-05-13-axon-remaining-update-review.md                   | new (this file)
```

Branch: `claude/prepare-writing-plans-MgAvT` — 17 commits ahead of `main`.
