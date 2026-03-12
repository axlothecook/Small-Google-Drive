/*
  Warnings:

  - You are about to drop the column `newFileName` on the `File` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "File_newFileName_key";

-- AlterTable
ALTER TABLE "File" DROP COLUMN "newFileName";
