/*
  Warnings:

  - You are about to drop the column `content` on the `Folder` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Folder" DROP COLUMN "content",
ADD COLUMN     "added" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
