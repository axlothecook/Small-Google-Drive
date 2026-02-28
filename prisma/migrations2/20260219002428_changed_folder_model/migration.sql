/*
  Warnings:

  - You are about to drop the `_FolderFollows` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_FolderFollows" DROP CONSTRAINT "_FolderFollows_A_fkey";

-- DropForeignKey
ALTER TABLE "_FolderFollows" DROP CONSTRAINT "_FolderFollows_B_fkey";

-- AlterTable
ALTER TABLE "Folder" ADD COLUMN     "followedBy" TEXT[],
ADD COLUMN     "following" TEXT[];

-- DropTable
DROP TABLE "_FolderFollows";
