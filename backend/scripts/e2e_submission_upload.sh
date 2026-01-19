#!/usr/bin/env zsh
set -euo pipefail

BASE="http://localhost:5000"
TEACHER_EMAIL="e2e_teacher+auto@example.com"
STUDENT_EMAIL="e2e_student+auto@example.com"
PASSWORD="StrongP@ssw0rd!"
COURSE_TITLE="E2E Auto Course"
ASSIGN_TITLE="E2E Auto Assignment"

echo "Health:"
curl -sS $BASE/api/health || curl -sS $BASE/

# helper to get token
get_token() {
  local email="$1" name="$2" role="$3"
  resp=$(curl -sS -X POST "$BASE/api/auth/login" -H "Content-Type: application/json" -d "{\"email\":\"$email\",\"password\":\"$PASSWORD\"}" || true)
  token=$(echo "$resp" | jq -r '.token // empty' 2>/dev/null || true)
  if [[ -n "$token" ]]; then echo "$token"; return 0; fi
  resp=$(curl -sS -X POST "$BASE/api/auth/register" -H "Content-Type: application/json" -d "{\"name\":\"$name\",\"email\":\"$email\",\"password\":\"$PASSWORD\",\"role\":\"$role\"}" || true)
  token=$(echo "$resp" | jq -r '.token // empty' 2>/dev/null || true)
  if [[ -n "$token" ]]; then echo "$token"; return 0; fi
  echo ""; return 1
}

TEACHER_TOKEN=$(get_token "$TEACHER_EMAIL" "E2E Teacher" "teacher")
STUDENT_TOKEN=$(get_token "$STUDENT_EMAIL" "E2E Student" "student")

echo "Teacher token prefix: ${TEACHER_TOKEN[1,20]}..."
echo "Student token prefix: ${STUDENT_TOKEN[1,20]}..."

# Create/find course
COURSE_ID=$(curl -sS "$BASE/api/my-courses" -H "Authorization: Bearer $TEACHER_TOKEN" | jq -r --arg t "$COURSE_TITLE" '.[]? | select(.title==$t) | .id' | head -n1)
if [[ -z "$COURSE_ID" ]]; then
  create_course_resp=$(curl -sS -X POST "$BASE/api/courses" -H "Content-Type: application/json" -H "Authorization: Bearer $TEACHER_TOKEN" -d "{\"title\":\"$COURSE_TITLE\"}" || true)
  COURSE_ID=$(echo "$create_course_resp" | jq -r '.course.id // .id // empty' || true)
fi

NOW=$(date -u +'%Y-%m-%d %H:%M:%S')
LATER=$(date -u -d '+2 hours' +'%Y-%m-%d %H:%M:%S')
create_assign_resp=$(curl -sS -X POST "$BASE/api/assignments" -H "Content-Type: application/json" -H "Authorization: Bearer $TEACHER_TOKEN" -d "{\"title\":\"$ASSIGN_TITLE\",\"description\":\"E2E script\",\"start_at\":\"$NOW\",\"end_at\":\"$LATER\",\"course_id\":$COURSE_ID}" || true)
ASSIGN_ID=$(echo "$create_assign_resp" | jq -r '.id // empty' || true)
if [[ -z "$ASSIGN_ID" ]]; then
  ASSIGN_ID=$(curl -sS "$BASE/api/assignments" -H "Authorization: Bearer $TEACHER_TOKEN" | jq -r --arg t "$ASSIGN_TITLE" '.[]? | select(.title==$t) | .id' | head -n1)
fi

echo "Course ID: $COURSE_ID"
echo "Assign ID: $ASSIGN_ID"

# Enroll student
curl -sS -X POST "$BASE/api/courses/$COURSE_ID/enroll" -H "Authorization: Bearer $STUDENT_TOKEN" -H "Content-Type: application/json" | jq .

# Presign
curl -sS -X POST "$BASE/api/uploads/presign" -H "Authorization: Bearer $STUDENT_TOKEN" -H "Content-Type: application/json" -d '{"filename":"e2e.txt","contentType":"text/plain"}' -o /tmp/presign.json || true
cat /tmp/presign.json
FALLBACK=$(jq -r '.fallback // empty' /tmp/presign.json || echo "")
if [[ "$FALLBACK" == "true" || -z "$FALLBACK" ]]; then
  UP_ENDPOINT=$(jq -r '.uploadEndpoint // empty' /tmp/presign.json || echo '/api/uploads')
  UP_FULL="$BASE${UP_ENDPOINT}"
  printf 'e2e-script-upload\n' > /tmp/e2e_upload.txt
  curl -sS -X POST "$UP_FULL" -H "Authorization: Bearer $STUDENT_TOKEN" -F file=@/tmp/e2e_upload.txt -o /tmp/upload_resp.json || true
  cat /tmp/upload_resp.json
  FILEURL=$(jq -r '.fileUrl // empty' /tmp/upload_resp.json || echo "")
else
  FILEURL=$(jq -r '.fileUrl // empty' /tmp/presign.json || echo "")
fi

# Submit
curl -sS -X POST "$BASE/api/assignments/$ASSIGN_ID/submissions" -H "Authorization: Bearer $STUDENT_TOKEN" -H "Content-Type: application/json" -d "{\"text_submission\":\"E2E via script\",\"file_url\":\"$FILEURL\"}" -o /tmp/submit_resp.json || true
cat /tmp/submit_resp.json

# Cleanup
rm -f /tmp/e2e_upload.txt /tmp/presign.json /tmp/upload_resp.json /tmp/submit_resp.json

echo "E2E script finished"
