Representative Dashboard - Demo steps

Prerequisites
- Backend running and reachable at the same origin (or configure proxy in Vite)
- A user account for a student and a representative for testing

How to run locally

1. Backend

```bash
cd smartstudio-lms/backend
npm install
# ensure .env contains DB credentials and JWT_SECRET
npm run dev
```

2. Frontend

```bash
cd smartstudio-lms/frontend
npm install
npm run dev
```

Demo flow to show to client

1. Log in as a representative (role != 'student') and open "Representantes" page.
2. Create a request to a student (if not already exists) via the "Solicitudes" flow or API.
3. Show the list of "Solicitudes creadas". Use the "Ver progreso" button to open a modal with the student's progress summary.
4. Switch to the student account and open the same page to see "Solicitudes recibidas" and use "Conceder" to grant consent. You will be prompted to set an optional expiration date.
5. As representative, refresh the requests list and demonstrate that you can view the student's progress (after consent).

Build for demo

```bash
cd smartstudio-lms/frontend
npm run build
# serve the build using any static server, e.g.:
# npm i -g serve
# serve -s dist -l 3000
```

Notes
- The Progress modal is basic; if you want a styled version (modal library or animations), I can upgrade it.
- Tests for the frontend are not yet added; recommend adding jest/vitest + React Testing Library.
