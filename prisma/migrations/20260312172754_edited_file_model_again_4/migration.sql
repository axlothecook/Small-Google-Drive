/*
  Warnings:

  - The primary key for the `File` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `publicId` on the `File` table. All the data in the column will be lost.
  - The `id` column on the `File` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `newName` to the `File` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "File_id_key";

-- DropIndex
DROP INDEX "File_publicId_key";

-- AlterTable
ALTER TABLE "File" DROP CONSTRAINT "File_pkey",
DROP COLUMN "publicId",
ADD COLUMN     "newName" TEXT NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "File_pkey" PRIMARY KEY ("id");
