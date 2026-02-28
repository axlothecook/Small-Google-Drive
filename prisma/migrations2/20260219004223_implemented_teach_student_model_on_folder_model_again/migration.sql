/*
  Warnings:

  - You are about to drop the column `teacherId` on the `Folder` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Folder" DROP CONSTRAINT "Folder_teacherId_fkey";

-- AlterTable
ALTER TABLE "Folder" DROP COLUMN "teacherId",
ADD COLUMN     "parentFolderId" INTEGER;

-- AddForeignKey
ALTER TABLE "Folder" ADD CONSTRAINT "Folder_parentFolderId_fkey" FOREIGN KEY ("parentFolderId") REFERENCES "Folder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
