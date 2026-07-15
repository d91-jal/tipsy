-- DropForeignKey
ALTER TABLE "TournamentActualResult" DROP CONSTRAINT "TournamentActualResult_winnerId_fkey";

-- AddForeignKey
ALTER TABLE "TournamentActualResult" ADD CONSTRAINT "TournamentActualResult_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;
