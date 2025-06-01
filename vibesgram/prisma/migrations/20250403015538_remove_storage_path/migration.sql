/*
  Warnings:

  - You are about to drop the column `storagePath` on the `Artifact` table. All the data in the column will be lost.
  - You are about to drop the column `storagePath` on the `Preview` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Artifact" DROP COLUMN "storagePath";

-- AlterTable
ALTER TABLE "Preview" DROP COLUMN "storagePath";
