-- CreateTable
CREATE TABLE "AICallQueue" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "priority" "QueuePriority" NOT NULL DEFAULT MEDIUM,
    "status" "QueueStatus" NOT NULL DEFAULT PENDING,
    "scheduledAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "lastAttemptAt" TIMESTAMP(3),
    "settings" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AICallQueue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TranscriptEntry" (
    "id" TEXT NOT NULL,
    "callId" TEXT NOT NULL,
    "speaker" "TranscriptSpeaker" NOT NULL,
    "text" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER,
    "sentiment" INTEGER,
    "confidence" DOUBLE PRECISION,
    "keywords" TEXT[],
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TranscriptEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIInsight" (
    "id" TEXT NOT NULL,
    "callId" TEXT NOT NULL,
    "type" "InsightType" NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "confidence" INTEGER NOT NULL,
    "priority" "InsightPriority" NOT NULL DEFAULT MEDIUM,
    "keywords" TEXT[],
    "context" JSONB,
    "status" "InsightStatus" NOT NULL DEFAULT ACTIVE,
    "dismissedAt" TIMESTAMP(3),
    "dismissedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIInsight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentCard" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "callId" TEXT,
    "type" "ContentCardType" NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "priority" "ContentCardPriority" NOT NULL DEFAULT MEDIUM,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDismissible" BOOLEAN NOT NULL DEFAULT true,
    "displayDuration" INTEGER,
    "actionButtons" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AICallMetrics" (
    "id" TEXT NOT NULL,
    "callId" TEXT NOT NULL,
    "responseTime" INTEGER,
    "firstResponseTime" INTEGER,
    "avgResponseTime" DOUBLE PRECISION,
    "aiSpeakingTime" INTEGER,
    "humanSpeakingTime" INTEGER,
    "silenceTime" INTEGER,
    "interruptions" INTEGER NOT NULL DEFAULT 0,
    "sentimentScore" DOUBLE PRECISION,
    "engagementScore" DOUBLE PRECISION,
    "clarityScore" DOUBLE PRECISION,
    "topics" JSONB,
    "keywords" TEXT[],
    "connectionQuality" INTEGER,
    "transcriptionAccuracy" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AICallMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AISettings" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "voiceId" TEXT,
    "modelId" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en',
    "voiceSettings" JSONB,
    "responseSpeed" INTEGER NOT NULL DEFAULT 5,
    "formalityLevel" INTEGER NOT NULL DEFAULT 5,
    "empathyLevel" INTEGER NOT NULL DEFAULT 5,
    "technicalDetail" INTEGER NOT NULL DEFAULT 5,
    "enableRecording" BOOLEAN NOT NULL DEFAULT true,
    "enableTranscription" BOOLEAN NOT NULL DEFAULT true,
    "enableInsights" BOOLEAN NOT NULL DEFAULT true,
    "enableRealTimeAnalysis" BOOLEAN NOT NULL DEFAULT true,
    "recordAnnouncement" BOOLEAN NOT NULL DEFAULT true,
    "aiDisclosure" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AISettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgressiveSettings" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "level" "ProgressiveLevel" NOT NULL DEFAULT OVERVIEW,
    "features" JSONB,
    "preferences" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgressiveSettings_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Call" ADD COLUMN     "mode" "CallMode" NOT NULL DEFAULT AI,
ADD COLUMN     "agentStatus" "AgentStatus" NOT NULL DEFAULT IDLE,
ADD COLUMN     "aiAgentId" TEXT,
ADD COLUMN     "aiSettings" JSONB,
ADD COLUMN     "sentiment" INTEGER,
ADD COLUMN     "keywords" TEXT[],
ADD COLUMN     "queuePriority" "QueuePriority" NOT NULL DEFAULT MEDIUM,
ADD COLUMN     "queuePosition" INTEGER,
ADD COLUMN     "scheduledAt" TIMESTAMP(3),
ADD COLUMN     "isAiEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isTranscribing" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isRecording" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "transcriptMode" "TranscriptMode" NOT NULL DEFAULT SIDEBAR;

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "enableAICalls" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "enableAITranscription" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "enableAIInsights" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "maxConcurrentAICalls" INTEGER NOT NULL DEFAULT 3;

-- CreateIndex
CREATE INDEX "AICallQueue_organizationId_idx" ON "AICallQueue"("organizationId");

-- CreateIndex
CREATE INDEX "AICallQueue_leadId_idx" ON "AICallQueue"("leadId");

-- CreateIndex
CREATE INDEX "AICallQueue_priority_idx" ON "AICallQueue"("priority");

-- CreateIndex
CREATE INDEX "AICallQueue_status_idx" ON "AICallQueue"("status");

-- CreateIndex
CREATE INDEX "AICallQueue_scheduledAt_idx" ON "AICallQueue"("scheduledAt");

-- CreateIndex
CREATE INDEX "TranscriptEntry_callId_idx" ON "TranscriptEntry"("callId");

-- CreateIndex
CREATE INDEX "TranscriptEntry_speaker_idx" ON "TranscriptEntry"("speaker");

-- CreateIndex
CREATE INDEX "TranscriptEntry_timestamp_idx" ON "TranscriptEntry"("timestamp");

-- CreateIndex
CREATE INDEX "AIInsight_callId_idx" ON "AIInsight"("callId");

-- CreateIndex
CREATE INDEX "AIInsight_type_idx" ON "AIInsight"("type");

-- CreateIndex
CREATE INDEX "AIInsight_priority_idx" ON "AIInsight"("priority");

-- CreateIndex
CREATE INDEX "AIInsight_status_idx" ON "AIInsight"("status");

-- CreateIndex
CREATE INDEX "ContentCard_organizationId_idx" ON "ContentCard"("organizationId");

-- CreateIndex
CREATE INDEX "ContentCard_callId_idx" ON "ContentCard"("callId");

-- CreateIndex
CREATE INDEX "ContentCard_type_idx" ON "ContentCard"("type");

-- CreateIndex
CREATE INDEX "ContentCard_priority_idx" ON "ContentCard"("priority");

-- CreateIndex
CREATE INDEX "ContentCard_isActive_idx" ON "ContentCard"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "AICallMetrics_callId_key" ON "AICallMetrics"("callId");

-- CreateIndex
CREATE UNIQUE INDEX "AISettings_organizationId_key" ON "AISettings"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "ProgressiveSettings_organizationId_key" ON "ProgressiveSettings"("organizationId");

-- CreateIndex
CREATE INDEX "Call_status_idx" ON "Call"("status");

-- CreateIndex
CREATE INDEX "Call_mode_idx" ON "Call"("mode");

-- CreateIndex
CREATE INDEX "Call_queuePriority_idx" ON "Call"("queuePriority");

-- AddForeignKey
ALTER TABLE "AICallQueue" ADD CONSTRAINT "AICallQueue_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AICallQueue" ADD CONSTRAINT "AICallQueue_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TranscriptEntry" ADD CONSTRAINT "TranscriptEntry_callId_fkey" FOREIGN KEY ("callId") REFERENCES "Call"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIInsight" ADD CONSTRAINT "AIInsight_callId_fkey" FOREIGN KEY ("callId") REFERENCES "Call"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentCard" ADD CONSTRAINT "ContentCard_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentCard" ADD CONSTRAINT "ContentCard_callId_fkey" FOREIGN KEY ("callId") REFERENCES "Call"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AICallMetrics" ADD CONSTRAINT "AICallMetrics_callId_fkey" FOREIGN KEY ("callId") REFERENCES "Call"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AISettings" ADD CONSTRAINT "AISettings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressiveSettings" ADD CONSTRAINT "ProgressiveSettings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;