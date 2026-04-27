-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "Stage" AS ENUM ('GROUP', 'ROUND_OF_32', 'ROUND_OF_16', 'QUARTER_FINAL', 'SEMI_FINAL', 'THIRD_PLACE', 'FINAL');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('SCHEDULED', 'LIVE', 'FINISHED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TournamentOddsType" AS ENUM ('REACH_FINAL', 'WIN');

-- CreateEnum
CREATE TYPE "Outcome" AS ENUM ('HOME', 'DRAW', 'AWAY');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "name" TEXT,
    "passwordHash" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "locale" TEXT NOT NULL DEFAULT 'sv',
    "invitedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Tournament" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameSv" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "oddsLockDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tournament_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Competition" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "accessCode" TEXT,
    "simulationMode" BOOLEAN NOT NULL DEFAULT false,
    "simulatedDate" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Competition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompetitionMember" (
    "id" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tipsPublic" BOOLEAN NOT NULL DEFAULT false,
    "isSimBot" BOOLEAN NOT NULL DEFAULT false,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompetitionMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Group" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,

    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "nameSv" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "fifaCode" TEXT NOT NULL,
    "flagUrl" TEXT,
    "groupId" TEXT NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "matchNumber" INTEGER NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "groupId" TEXT,
    "homeTeamId" TEXT,
    "awayTeamId" TEXT,
    "stage" "Stage" NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "tipDeadline" TIMESTAMP(3) NOT NULL,
    "venue" TEXT,
    "homeScore" INTEGER,
    "awayScore" INTEGER,
    "status" "MatchStatus" NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchOdds" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "outcome" "Outcome" NOT NULL,
    "avgValue" DECIMAL(6,2) NOT NULL,
    "sources" JSONB NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recordedBy" TEXT NOT NULL,

    CONSTRAINT "MatchOdds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdvancementOdds" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "avgValue" DECIMAL(6,2) NOT NULL,
    "sources" JSONB NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recordedBy" TEXT NOT NULL,

    CONSTRAINT "AdvancementOdds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TournamentOdds" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "type" "TournamentOddsType" NOT NULL,
    "avgValue" DECIMAL(6,2) NOT NULL,
    "sources" JSONB NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recordedBy" TEXT NOT NULL,

    CONSTRAINT "TournamentOdds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchTip" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "prediction" "Outcome" NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "pointsEarned" DECIMAL(6,2),

    CONSTRAINT "MatchTip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupAdvancementTip" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "firstTeamId" TEXT NOT NULL,
    "secondTeamId" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "pointsEarned" DECIMAL(6,2),

    CONSTRAINT "GroupAdvancementTip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TournamentTip" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "finalist1Id" TEXT NOT NULL,
    "finalist2Id" TEXT NOT NULL,
    "winnerId" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "pointsEarned" DECIMAL(6,2),

    CONSTRAINT "TournamentTip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupActualAdvancement" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "GroupActualAdvancement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TournamentActualResult" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "finalist1Id" TEXT NOT NULL,
    "finalist2Id" TEXT NOT NULL,
    "winnerId" TEXT NOT NULL,

    CONSTRAINT "TournamentActualResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Tournament_slug_key" ON "Tournament"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Competition_slug_key" ON "Competition"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "CompetitionMember_competitionId_userId_key" ON "CompetitionMember"("competitionId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Group_tournamentId_name_key" ON "Group"("tournamentId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Team_fifaCode_key" ON "Team"("fifaCode");

-- CreateIndex
CREATE UNIQUE INDEX "MatchOdds_matchId_outcome_key" ON "MatchOdds"("matchId", "outcome");

-- CreateIndex
CREATE UNIQUE INDEX "AdvancementOdds_teamId_key" ON "AdvancementOdds"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentOdds_teamId_type_key" ON "TournamentOdds"("teamId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "MatchTip_userId_matchId_key" ON "MatchTip"("userId", "matchId");

-- CreateIndex
CREATE UNIQUE INDEX "GroupAdvancementTip_userId_groupId_key" ON "GroupAdvancementTip"("userId", "groupId");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentTip_userId_key" ON "TournamentTip"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GroupActualAdvancement_groupId_position_key" ON "GroupActualAdvancement"("groupId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "GroupActualAdvancement_groupId_teamId_key" ON "GroupActualAdvancement"("groupId", "teamId");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentActualResult_tournamentId_key" ON "TournamentActualResult"("tournamentId");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Competition" ADD CONSTRAINT "Competition_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitionMember" ADD CONSTRAINT "CompetitionMember_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitionMember" ADD CONSTRAINT "CompetitionMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_homeTeamId_fkey" FOREIGN KEY ("homeTeamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_awayTeamId_fkey" FOREIGN KEY ("awayTeamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchOdds" ADD CONSTRAINT "MatchOdds_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdvancementOdds" ADD CONSTRAINT "AdvancementOdds_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentOdds" ADD CONSTRAINT "TournamentOdds_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchTip" ADD CONSTRAINT "MatchTip_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchTip" ADD CONSTRAINT "MatchTip_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupAdvancementTip" ADD CONSTRAINT "GroupAdvancementTip_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupAdvancementTip" ADD CONSTRAINT "GroupAdvancementTip_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupAdvancementTip" ADD CONSTRAINT "GroupAdvancementTip_firstTeamId_fkey" FOREIGN KEY ("firstTeamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupAdvancementTip" ADD CONSTRAINT "GroupAdvancementTip_secondTeamId_fkey" FOREIGN KEY ("secondTeamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentTip" ADD CONSTRAINT "TournamentTip_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentTip" ADD CONSTRAINT "TournamentTip_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentTip" ADD CONSTRAINT "TournamentTip_finalist1Id_fkey" FOREIGN KEY ("finalist1Id") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentTip" ADD CONSTRAINT "TournamentTip_finalist2Id_fkey" FOREIGN KEY ("finalist2Id") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentTip" ADD CONSTRAINT "TournamentTip_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupActualAdvancement" ADD CONSTRAINT "GroupActualAdvancement_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupActualAdvancement" ADD CONSTRAINT "GroupActualAdvancement_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentActualResult" ADD CONSTRAINT "TournamentActualResult_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentActualResult" ADD CONSTRAINT "TournamentActualResult_finalist1Id_fkey" FOREIGN KEY ("finalist1Id") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentActualResult" ADD CONSTRAINT "TournamentActualResult_finalist2Id_fkey" FOREIGN KEY ("finalist2Id") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentActualResult" ADD CONSTRAINT "TournamentActualResult_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
