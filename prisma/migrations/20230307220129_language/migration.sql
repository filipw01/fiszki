-- AlterTable
ALTER TABLE "Flashcard" ADD COLUMN     "backLanguage" TEXT NOT NULL DEFAULT 'en-US',
ADD COLUMN     "frontLanguage" TEXT NOT NULL DEFAULT 'en-US';

-- AlterTable
ALTER TABLE "Folder" ADD COLUMN     "defaultBackLanguage" TEXT,
ADD COLUMN     "defaultFrontLanguage" TEXT;
