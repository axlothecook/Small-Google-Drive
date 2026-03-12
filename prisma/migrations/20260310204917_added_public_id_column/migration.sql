/*
  Warnings:

  - A unique constraint covering the columns `[publicId]` on the table `File` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `publicId` to the `File` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "File" ADD COLUMN     "publicId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "File_publicId_key" ON "File"("publicId");
