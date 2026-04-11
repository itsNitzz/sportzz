/*
  Warnings:

  - You are about to drop the column `awaScore` on the `Match` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Match" RENAME COLUMN "awaScore" TO "awayScore";
