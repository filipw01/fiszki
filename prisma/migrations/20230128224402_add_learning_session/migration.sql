-- AlterTable
ALTER TABLE "Flashcard" ADD COLUMN     "completedLearningSessionId" TEXT,
ADD COLUMN     "uncompletedLearningSessionId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "learningSessionId" TEXT;

-- CreateTable
CREATE TABLE "LearningSession" (
    "id" TEXT NOT NULL,
    "ownerEmail" TEXT NOT NULL,

    CONSTRAINT "LearningSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LearningSession_ownerEmail_key" ON "LearningSession"("ownerEmail");

-- AddForeignKey
ALTER TABLE "Flashcard" ADD CONSTRAINT "Flashcard_uncompletedLearningSessionId_fkey" FOREIGN KEY ("uncompletedLearningSessionId") REFERENCES "LearningSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Flashcard" ADD CONSTRAINT "Flashcard_completedLearningSessionId_fkey" FOREIGN KEY ("completedLearningSessionId") REFERENCES "LearningSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningSession" ADD CONSTRAINT "LearningSession_ownerEmail_fkey" FOREIGN KEY ("ownerEmail") REFERENCES "User"("email") ON DELETE RESTRICT ON UPDATE CASCADE;
