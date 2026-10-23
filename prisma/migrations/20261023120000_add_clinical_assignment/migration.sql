-- CreateTable
CREATE TABLE "ClinicalAssignment" (
    "id" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "groupNo" INTEGER NOT NULL,
    "weekNo" INTEGER NOT NULL,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "hospital" TEXT NOT NULL,
    "ward" TEXT NOT NULL,
    "shift" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClinicalAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClinicalAssignment_name_idx" ON "ClinicalAssignment"("name");
