Migrations and applying SQL changes
=================================

This project uses raw SQL migration files stored in `database/migrations/`.

How it works
------------
- Each SQL file in `database/migrations/` will be applied in filename order.
- The script `backend/scripts/run_migrations.sh` applies files not yet recorded in the `migrations` table.
- The first migration `20251124120000_create_migrations_table.sql` creates the tracking table.

Prerequisites
-------------
- `mysql` CLI must be available in PATH.
- Environment variables required: `DB_HOST`, `DB_USER`, `DB_NAME`. `DB_PASSWORD` optional (script handles it).
- Env standard: use `backend/.env.example` as reference and copy to `backend/.env`.

Example
-------
From the repository root:

```bash
cd backend
DB_HOST=localhost DB_USER=root DB_PASSWORD=secret DB_NAME=smartstudio_lms ./scripts/run_migrations.sh
```

Tip
---
- If you already have `backend/.env`, you can `export $(cat .env | xargs)` before running the script.

Notes
-----
- Migrations are idempotent: a file already applied will be skipped.
- For production use, ensure you have backups before running migrations.
- If you manage migrations with another tool (Flyway, Liquibase), adapt accordingly.
 
Rate limiting while testing
--------------------------

- The server supports disabling rate limiters using the environment variable `RATE_LIMITS_DISABLED`.
- Set `RATE_LIMITS_DISABLED=1` or `RATE_LIMITS_DISABLED=true` to bypass rate limiting (useful for CI or fast integration tests).
- By default the server also disables rate limiting when `NODE_ENV` is `test` to avoid flakiness in automated test runs.

File uploads and S3 presigned URLs
----------------------------------

- This backend supports generating S3 presigned PUT URLs via `POST /api/uploads/presign` (authenticated).
- To enable S3 presigning set the following env vars: `S3_BUCKET`, `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`.
- If S3 is not configured the endpoint will return a fallback object `{ fallback: true, uploadEndpoint: "/api/uploads" }` and the server accepts multipart uploads at `POST /api/uploads` (field name `file`) and serves uploaded files under `/uploads`.
- After uploading to the presigned URL (PUT) or the fallback endpoint, send the returned `fileUrl` as `file_url` in the submission payload (`POST /api/assignments/:id/submissions`).

Dependencies:
- The backend now requires `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner` and `multer` for the upload endpoints. Run `npm install` in `backend` to add them.
