#!/usr/bin/env zsh
set -euo pipefail

# Temporary E2E script: will be deleted after run
BASE="http://localhost:5000"
TEACHER_EMAIL="teacher+auto-ui@example.com"
STUDENT_EMAIL="student+auto-ui@example.com"
PASSWORD="StrongP@ssw0rd!"
COURSE_TITLE="Auto UI Course"
ASSIGN_TITLE="Auto Assignment UI"

# Ensure jq exists
if ! command -v jq >/dev/null 2>&1; then
  echo "ERROR: 'jq' is required. Install it and re-run." >&2
  exit 2
fi

echo "--- Health check ---"
curl -sS "$BASE/api/health" || curl -sS "$BASE/"

get_token() {
  local email="$1" name="$2" role="$3"
  for attempt in 1 2 3; do
    # try login
    resp=$(curl -sS -X POST "$BASE/api/auth/login" -H "Content-Type: application/json" -d "{\"email\":\"$email\",\"password\":\"$PASSWORD\"}" || true)
    token=$(echo "$resp" | jq -r '.token // empty' 2>/dev/null || true)
    if [[ -n "$token" ]]; then
      echo "$token"
      return 0
    fi
    # try register
    resp2=$(curl -sS -X POST "$BASE/api/auth/register" -H "Content-Type: application/json" -d "{\"name\":\"$name\",\"email\":\"$email\",\"password\":\"$PASSWORD\",\"role\":\"$role\"}" || true)
    token2=$(echo "$resp2" | jq -r '.token // empty' 2>/dev/null || true)
    if [[ -n "$token2" ]]; then
      echo "$token2"
      return 0
    fi
    # If both failed, wait and retry
    sleep 1
  done
  # print last responses for debugging
  echo "LOGIN_RESP: $resp" >&2
  echo "REGISTER_RESP: $resp2" >&2
  return 1
}

echo "Obtaining teacher token..."
TEACHER_TOKEN=$(get_token "$TEACHER_EMAIL" "Auto Teacher" "teacher")
if [[ $? -ne 0 || -z "$TEACHER_TOKEN" ]]; then
  echo "ERROR: could not obtain teacher token" >&2
  exit 1
fi

echo "Obtaining student token..."
STUDENT_TOKEN=$(get_token "$STUDENT_EMAIL" "Auto Student" "student")
if [[ $? -ne 0 || -z "$STUDENT_TOKEN" ]]; then
  echo "ERROR: could not obtain student token" >&2
  exit 1
fi

echo "Teacher token prefix: ${TEACHER_TOKEN[1,20]}..."
echo "Student token prefix: ${STUDENT_TOKEN[1,20]}..."

# Find or create course
COURSE_ID=$(curl -sS "$BASE/api/my-courses" -H "Authorization: Bearer $TEACHER_TOKEN" | jq -r --arg t "$COURSE_TITLE" '.[]? | select(.title==$t) | .id' | head -n1)
if [[ -z "$COURSE_ID" ]]; then
  echo "Creating course..."
  create_course_resp=$(curl -sS -X POST "$BASE/api/courses" -H "Content-Type: application/json" -H "Authorization: Bearer $TEACHER_TOKEN" -d "{\"title\":\"$COURSE_TITLE\"}" || true)
  COURSE_ID=$(echo "$create_course_resp" | jq -r '.course.id // .id // empty' || true)
fi
if [[ -z "$COURSE_ID" ]]; then
  echo "ERROR: could not determine COURSE_ID" >&2
  echo "$create_course_resp" | jq . || echo "$create_course_resp"
  exit 1
fi

echo "Course ID: $COURSE_ID"

# Find or create assignment
ASSIGN_ID=$(curl -sS "$BASE/api/assignments" -H "Authorization: Bearer $TEACHER_TOKEN" | jq -r --arg t "$ASSIGN_TITLE" '.[]? | select(.title==$t) | .id' | head -n1)
if [[ -z "$ASSIGN_ID" ]]; then
  NOW=$(date -u +'%Y-%m-%d %H:%M:%S')
  LATER=$(date -u -d '+2 hours' +'%Y-%m-%d %H:%M:%S')
  create_assign_resp=$(curl -sS -X POST "$BASE/api/assignments" -H "Content-Type: application/json" -H "Authorization: Bearer $TEACHER_TOKEN" -d "{\"title\":\"$ASSIGN_TITLE\",\"description\":\"Prueba automatizada\",\"start_at\":\"$NOW\",\"end_at\":\"$LATER\",\"course_id\":$COURSE_ID}" || true)
  ASSIGN_ID=$(echo "$create_assign_resp" | jq -r '.id // empty' || true)
fi
if [[ -z "$ASSIGN_ID" ]]; then
  echo "ERROR: could not determine ASSIGN_ID" >&2
  echo "$create_assign_resp" | jq . || echo "$create_assign_resp"
  exit 1
fi

echo "Assignment ID: $ASSIGN_ID"

# Enroll student
echo "Enrolling student (self-enroll)..."
enroll_resp=$(curl -sS -X POST "$BASE/api/courses/$COURSE_ID/enroll" -H "Authorization: Bearer $STUDENT_TOKEN" -H "Content-Type: application/json" || true)
echo "Enroll response:"; echo "$enroll_resp" | jq . || echo "$enroll_resp"

# Student submits
echo "Student submitting assignment..."
submit_resp=$(curl -sS -X POST "$BASE/api/assignments/$ASSIGN_ID/submissions" -H "Authorization: Bearer $STUDENT_TOKEN" -H "Content-Type: application/json" -d '{"text_submission":"Entrega automática desde tmp script","file_url":null}' || true)
echo "Submit response:"; echo "$submit_resp" | jq . || echo "$submit_resp"
SUBMISSION_ID=$(echo "$submit_resp" | jq -r '.submissionId // .id // empty' || true)
if [[ -z "$SUBMISSION_ID" ]]; then
  SUBMISSION_ID=$(curl -sS "$BASE/api/assignments/$ASSIGN_ID/submissions" -H "Authorization: Bearer $TEACHER_TOKEN" | jq -r '.[0].id // .[0].submissionId // empty' || true)
fi
if [[ -z "$SUBMISSION_ID" ]]; then
  echo "ERROR: could not determine SUBMISSION_ID" >&2
  exit 1
fi

echo "Submission ID: $SUBMISSION_ID"

# Teacher lists
echo "Teacher listing submissions..."
list_resp=$(curl -sS "$BASE/api/assignments/$ASSIGN_ID/submissions" -H "Authorization: Bearer $TEACHER_TOKEN" || true)
echo "$list_resp" | jq . || echo "$list_resp"

# Teacher grades
echo "Teacher grading submission..."
grade_resp=$(curl -sS -X POST "$BASE/api/submissions/$SUBMISSION_ID/grade" -H "Authorization: Bearer $TEACHER_TOKEN" -H "Content-Type: application/json" -d '{"score":9.5,"feedback":"Buen trabajo automático"}' || true)
echo "Grade response:"; echo "$grade_resp" | jq . || echo "$grade_resp"

# Student fetches
echo "Student fetching their submission..."
view_resp=$(curl -sS "$BASE/api/submissions/$SUBMISSION_ID" -H "Authorization: Bearer $STUDENT_TOKEN" || true)
echo "$view_resp" | jq . || echo "$view_resp"

echo "--- E2E flow completed ---"
