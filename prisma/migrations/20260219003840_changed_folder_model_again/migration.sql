/*
  Warnings:

  - You are about to drop the column `followedBy` on the `Folder` table. All the data in the column will be lost.
  - You are about to drop the column `following` on the `Folder` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Folder" DROP COLUMN "followedBy",
DROP COLUMN "following",
ADD COLUMN     "parentFolderId" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "teacherId" INTEGER;

-- AddForeignKey
ALTER TABLE "Folder" ADD CONSTRAINT "Folder_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Folder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
