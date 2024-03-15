/*
  Warnings:

  - You are about to drop the column `siteName` on the `OpenGraphTag` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `OpenGraphTag` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[urlCode]` on the table `ShortenedUrl` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "OpenGraphTag" DROP COLUMN "siteName",
DROP COLUMN "type";

-- CreateIndex
CREATE UNIQUE INDEX "ShortenedUrl_urlCode_key" ON "ShortenedUrl"("urlCode");
