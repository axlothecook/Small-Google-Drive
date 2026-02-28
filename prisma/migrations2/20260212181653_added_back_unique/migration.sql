/*
  Warnings:

  - A unique constraint covering the columns `[title]` on the table `File` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[title]` on the table `Folder` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[username]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "File_title_key" ON "File"("title");

-- CreateIndex
CREATE UNIQUE INDEX "Folder_title_key" ON "Folder"("title");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
