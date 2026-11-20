-- 학생용 EHR 연습: AI가 만든 가상 사례 + 학생이 작성한 기록
CREATE TABLE IF NOT EXISTS "EhrCase" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "scenario" JSONB NOT NULL,
  "data" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "comment" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "submittedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "EhrCase_userId_idx" ON "EhrCase" ("userId");
CREATE INDEX IF NOT EXISTS "EhrCase_status_idx" ON "EhrCase" ("status");
