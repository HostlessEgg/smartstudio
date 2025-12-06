#!/usr/bin/env zsh
set -euo pipefail

BASE="http://localhost:5000"
TEACHER_EMAIL="teacher+auto-ui@example.com"
STUDENT_EMAIL="student+auto-ui@example.com"
PASSWORD="StrongP@ssw0rd!"
COURSE_TITLE="Auto UI Course"
ASSIGN_TITLE="Auto Assignment UI"

echo "--- Health check ---"
curl -sS "$BASE/api/health" || curl -sS "$BASE/"

# Helper: attempt login, fall back to register, then return token
get_token() {
  local email="$1"
  local name="$2"
  local role="$3"
  # Try login/register with retries in case of rate limiting
  local attempt
  for attempt in 1 2 3 4 5; do
    echo "-> Attempting login for $email (attempt $attempt)" >&2
    local resp login_token
    resp=$(curl -sS -X POST "$BASE/api/auth/login" -H "Content-Type: application/json" -d "{\"email\":\"$email\",\"password\":\"$PASSWORD\"}" 2>/dev/null || echo "")
    login_token=$(echo "$resp" | jq -r '.token // empty' 2>/dev/null || echo "")
    if [[ -n "$login_token" ]]; then
      echo "   Logged in." >&2
      echo "$login_token"
      return 0
    fi

    # If server returned rate limit message, backoff and retry
    if echo "$resp" | grep -qi "too many requests" || echo "$resp" | grep -qi "429"; then
      sleep $((attempt * 2))
      continue
    fi

    echo "   Login failed; trying register for $email" >&2
    resp=$(curl -sS -X POST "$BASE/api/auth/register" -H "Content-Type: application/json" -d "{\"name\":\"$name\",\"email\":\"$email\",\"password\":\"$PASSWORD\",\"role\":\"$role\"}" 2>/dev/null || echo "")
    local reg_token
    reg_token=$(echo "$resp" | jq -r '.token // empty' 2>/dev/null || echo "")
    if [[ -n "$reg_token" ]]; then
      echo "   Registered and got token." >&2
      echo "$reg_token"
      return 0
    fi

    if echo "$resp" | grep -qi "too many requests" || echo "$resp" | grep -qi "429"; then
      sleep $((attempt * 2))
      continue
    fi

    # if response isn't rate-limited, break and report
    echo "   ERROR: couldn't login or register for $email. Response:" >&2
    echo "$resp" | jq . >&2 || echo "$resp" >&2
    return 1
  done
  echo "   ERROR: exhausted retries for $email" >&2
  return 1
}

TEACHER_TOKEN=$(get_token "$TEACHER_EMAIL" "Auto Teacher" "teacher")
STUDENT_TOKEN=$(get_token "$STUDENT_EMAIL" "Auto Student" "student")

echo
echo "Teacher token: ${TEACHER_TOKEN:0:20}..."
echo "Student token: ${STUDENT_TOKEN:0:20}..."
echo

# Create or find course
echo "--- Create or find course ---"
course_resp=$(curl -sS -X POST "$BASE/api/courses" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TEACHER_TOKEN" \
  -d "{\"title\":\"$COURSE_TITLE\"}" 2>/dev/null || echo "")
COURSE_ID=$(echo "$course_resp" | jq -r '.course.id // .id // empty' 2>/dev/null || echo "")

if [[ -z "$COURSE_ID" ]]; then
  echo "Course create may have failed or course already exists; searching teacher courses..."
  COURSE_ID=$(curl -sS "$BASE/api/my-courses" -H "Authorization: Bearer $TEACHER_TOKEN" | jq -r --arg t "$COURSE_TITLE" '.courses[]? | select(.title==$t) | .id' | head -n1)
fi

if [[ -z "$COURSE_ID" ]]; then
  echo "ERROR: could not determine COURSE_ID. Server responses:"
  echo "create response:"
  echo "$course_resp" | jq . || echo "$course_resp"
  exit 1
fi

echo "Course ID: $COURSE_ID"

# Create assignment (teacher)
echo "--- Create or find assignment ---"
NOW=$(date -u +'%Y-%m-%d %H:%M:%S')
LATER=$(date -u -d '+2 hours' +'%Y-%m-%d %H:%M:%S')
assign_resp=$(curl -sS -X POST "$BASE/api/assignments" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TEACHER_TOKEN" \
  -d "{\"title\":\"$ASSIGN_TITLE\",\"description\":\"Prueba automática\",\"start_at\":\"$NOW\",\"end_at\":\"$LATER\",\"course_id\":$COURSE_ID}" 2>/dev/null || echo "")
ASSIGN_ID=$(echo "$assign_resp" | jq -r '.id // empty' 2>/dev/null || echo "")

if [[ -z "$ASSIGN_ID" ]]; then
  echo "Create assignment response didn't return id; trying to find by title..."
  ASSIGN_ID=$(curl -sS "$BASE/api/assignments" -H "Authorization: Bearer $TEACHER_TOKEN" 2>/dev/null | jq -r --arg t "$ASSIGN_TITLE" '.[]? | select(.title==$t) | .id' | head -n1)
fi

if [[ -z "$ASSIGN_ID" ]]; then
  echo "ERROR: could not determine ASSIGN_ID. Server responses:"
  echo "$assign_resp" | jq . || echo "$assign_resp"
  exit 1
fi

echo "Assignment ID: $ASSIGN_ID"

# Enroll student
echo "--- Enroll student ---"
enroll_resp=$(curl -sS -X POST "$BASE/api/courses/$COURSE_ID/enroll" \
  -H "Authorization: Bearer $STUDENT_TOKEN" -H "Content-Type: application/json" 2>/dev/null || echo "")
echo "Enroll response:"
echo "$enroll_resp" | jq . || echo "$enroll_resp"

# Student submits assignment
echo "--- Student submits assignment ---"
submit_resp=$(curl -sS -X POST "$BASE/api/assignments/$ASSIGN_ID/submissions" \
  -H "Authorization: Bearer $STUDENT_TOKEN" -H "Content-Type: application/json" \
  -d '{"text_submission":"Entrega desde script","file_url":null}' 2>/dev/null || echo "")
echo "Submit response:"
echo "$submit_resp" | jq . || echo "$submit_resp"
SUBMISSION_ID=$(echo "$submit_resp" | jq -r '.submissionId // .id // empty' 2>/dev/null || echo "")

if [[ -z "$SUBMISSION_ID" ]]; then
  echo "Attempting to find submission by listing assignments' submissions..."
  SUBMISSION_ID=$(curl -sS "$BASE/api/assignments/$ASSIGN_ID/submissions" -H "Authorization: Bearer $TEACHER_TOKEN" 2>/dev/null | jq -r '.[0].id // .[0].submissionId // empty')
fi

if [[ -z "$SUBMISSION_ID" ]]; then
  echo "ERROR: could not get SUBMISSION_ID. Submit response:"
  echo "$submit_resp" | jq . || echo "$submit_resp"
  exit 1
fi

echo "Submission ID: $SUBMISSION_ID"

# Teacher lists submissions
echo "--- Teacher lists submissions ---"
list_resp=$(curl -sS "$BASE/api/assignments/$ASSIGN_ID/submissions" -H "Authorization: Bearer $TEACHER_TOKEN" 2>/dev/null || echo "")
echo "$list_resp" | jq . || echo "$list_resp"

# Teacher grades submission
echo "--- Teacher grades submission ---"
grade_resp=$(curl -sS -X POST "$BASE/api/submissions/$SUBMISSION_ID/grade" \
  -H "Authorization: Bearer $TEACHER_TOKEN" -H "Content-Type: application/json" \
  -d '{"score":9.5,"feedback":"Buen trabajo"}' 2>/dev/null || echo "")
echo "Grade response:"
echo "$grade_resp" | jq . || echo "$grade_resp"

# Student fetches their submission
echo "--- Student fetches their submission ---"
view_resp=$(curl -sS "$BASE/api/submissions/$SUBMISSION_ID" -H "Authorization: Bearer $STUDENT_TOKEN" 2>/dev/null || echo "")
echo "$view_resp" | jq . || echo "$view_resp"

echo "--- Done ---"
