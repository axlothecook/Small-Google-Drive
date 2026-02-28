/*
  Warnings:

  - You are about to drop the column `title` on the `File` table. All the data in the column will be lost.
  - You are about to drop the column `url` on the `File` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[newFileName]` on the table `File` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `newFileName` to the `File` table without a default value. This is not possible if the table is not empty.
  - Added the required column `originalName` to the `File` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "File_title_key";

-- AlterTable
ALTER TABLE "File" DROP COLUMN "title",
DROP COLUMN "url",
ADD COLUMN     "newFileName" TEXT NOT NULL,
ADD COLUMN     "originalName" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "File_newFileName_key" ON "File"("newFileName");
