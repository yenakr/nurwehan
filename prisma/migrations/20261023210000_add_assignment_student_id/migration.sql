ALTER TABLE "ClinicalAssignment" ADD COLUMN "studentId" TEXT;
CREATE INDEX "ClinicalAssignment_studentId_idx" ON "ClinicalAssignment"("studentId");
