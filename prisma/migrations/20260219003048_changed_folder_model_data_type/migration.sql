/*
  Warnings:

  - The `followedBy` column on the `Folder` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `following` column on the `Folder` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Folder" DROP COLUMN "followedBy",
ADD COLUMN     "followedBy" INTEGER NOT NULL DEFAULT 0,
DROP COLUMN "following",
ADD COLUMN     "following" INTEGER NOT NULL DEFAULT 0;
