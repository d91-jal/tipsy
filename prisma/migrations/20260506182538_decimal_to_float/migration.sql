/*
  Warnings:

  - You are about to alter the column `avgValue` on the `AdvancementOdds` table. The data in that column could be lost. The data in that column will be cast from `Decimal(6,2)` to `DoublePrecision`.
  - You are about to alter the column `pointsEarned` on the `GroupAdvancementTip` table. The data in that column could be lost. The data in that column will be cast from `Decimal(6,2)` to `DoublePrecision`.
  - You are about to alter the column `avgValue` on the `MatchOdds` table. The data in that column could be lost. The data in that column will be cast from `Decimal(6,2)` to `DoublePrecision`.
  - You are about to alter the column `pointsEarned` on the `MatchTip` table. The data in that column could be lost. The data in that column will be cast from `Decimal(6,2)` to `DoublePrecision`.
  - You are about to alter the column `avgValue` on the `TournamentOdds` table. The data in that column could be lost. The data in that column will be cast from `Decimal(6,2)` to `DoublePrecision`.
  - You are about to alter the column `pointsEarned` on the `TournamentTip` table. The data in that column could be lost. The data in that column will be cast from `Decimal(6,2)` to `DoublePrecision`.

*/
-- AlterTable
ALTER TABLE "AdvancementOdds" ALTER COLUMN "avgValue" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "GroupAdvancementTip" ALTER COLUMN "pointsEarned" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "MatchOdds" ALTER COLUMN "avgValue" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "MatchTip" ALTER COLUMN "pointsEarned" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "TournamentOdds" ALTER COLUMN "avgValue" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "TournamentTip" ALTER COLUMN "pointsEarned" SET DATA TYPE DOUBLE PRECISION;
