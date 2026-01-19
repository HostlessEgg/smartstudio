CHANGELOG — SmartStudio LMS

2026-01-08  — Seeders, Admin dashboard, tests, recovery

Added
- backend/scripts/seed_sample_data.js — seeds courses, modules, lessons, cohorts, enrollments, assignment.
- backend/scripts/seed_additional_data.js — seeds quiz_submissions, forum_threads/posts, submissions, representatives.
- frontend/src/pages/AdminDashboard.jsx — admin metrics + recent assignments view.
- frontend/src/components/ErrorBoundary.jsx — global React error boundary.
- frontend/src/contexts/ToastContext.jsx and frontend/src/components/ToastContainer.jsx — toast UX for feedback.
- RECOVERY_REPORT.md — report of recovery steps and instructions.
- database/dump_seeded.sql — SQL dump of the seeded DB (snapshot).

Changed
- backend/server.js
  - Expanded `/api/admin/summary` to include `forum_threads`, `quiz_submissions`, `assignments` and `recent_assignments`.
  - Implemented runtime-checkable rate-limit wrappers so `RATE_LIMITS_DISABLED` can bypass limiters during tests.
  - Fixed prepared-statement usage for `LIMIT/OFFSET` in courses pagination.

Tests
- Executed backend tests (Jest) and frontend tests (Vitest). All tests now pass locally after fixes.

Notes
- If you want these changes committed and pushed, tell me which commit message and branch to use.
- For CI, ensure `RATE_LIMITS_DISABLED=1` or whitelist CI IPs to avoid rate-limit flakiness during automated test runs.

Files touched (high level)
- backend/server.js
- backend/scripts/seed_sample_data.js
- backend/scripts/seed_additional_data.js
- backend/tests/* (tests executed)
- frontend/src/pages/AdminDashboard.jsx
- frontend/src/components/ErrorBoundary.jsx
- frontend/src/contexts/ToastContext.jsx
- frontend/src/components/ToastContainer.jsx
- RECOVERY_REPORT.md
- database/dump_seeded.sql

-- End of changelog
