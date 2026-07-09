-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('email', 'google', 'apple');

-- CreateEnum
CREATE TYPE "VisibilityType" AS ENUM ('private', 'public', 'shared');

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('manual', 'image', 'pdf', 'text', 'docx');

-- CreateEnum
CREATE TYPE "ParseStatus" AS ENUM ('pending', 'processing', 'done', 'failed');

-- CreateEnum
CREATE TYPE "ImportFileType" AS ENUM ('image', 'pdf', 'text', 'docx', 'url');

-- CreateEnum
CREATE TYPE "ImportStatus" AS ENUM ('pending', 'processing', 'done', 'partial', 'failed');

-- CreateEnum
CREATE TYPE "DifficultyLevel" AS ENUM ('easy', 'medium', 'hard');

-- CreateEnum
CREATE TYPE "QuestionStatus" AS ENUM ('draft', 'active', 'archived');

-- CreateEnum
CREATE TYPE "ExplanationSource" AS ENUM ('ai', 'manual');

-- CreateEnum
CREATE TYPE "PracticeMode" AS ENUM ('quick', 'deep', 'exam', 'weakness');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('in_progress', 'completed', 'abandoned');

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('pending', 'synced', 'conflict');

-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('free', 'pro', 'unlimited');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('active', 'cancelled', 'expired', 'past_due');

-- CreateEnum
CREATE TYPE "AiFeatureType" AS ENUM ('parse_import', 'explanation', 'translation', 're_explanation');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "password_hash" TEXT,
    "name" TEXT NOT NULL,
    "avatar_url" TEXT,
    "auth_provider" "AuthProvider" NOT NULL DEFAULT 'email',
    "provider_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "plan" "SubscriptionPlan" NOT NULL DEFAULT 'free',
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'active',
    "ai_parse_quota" INTEGER,
    "ai_explain_quota" INTEGER,
    "ai_translate_quota" INTEGER,
    "current_period_start" TIMESTAMPTZ NOT NULL,
    "current_period_end" TIMESTAMPTZ NOT NULL,
    "cancelled_at" TIMESTAMPTZ,
    "external_id" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_usage_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "feature_type" "AiFeatureType" NOT NULL,
    "ref_id" UUID,
    "input_tokens" INTEGER NOT NULL DEFAULT 0,
    "output_tokens" INTEGER NOT NULL DEFAULT 0,
    "cost_usd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_usage_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_sets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "owner_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "visibility" "VisibilityType" NOT NULL DEFAULT 'private',
    "sourceType" "SourceType" NOT NULL DEFAULT 'manual',
    "source_file_url" TEXT,
    "ai_parse_status" "ParseStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "question_sets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "topics" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "question_set_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "ai_suggested_name" TEXT,
    "confirmed_by_user" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "question_set_id" UUID NOT NULL,
    "topic_id" UUID,
    "content" TEXT,
    "content_vi" TEXT,
    "image_url" TEXT,
    "choices" JSONB NOT NULL DEFAULT '[]',
    "explanation" JSONB,
    "difficulty" "DifficultyLevel" NOT NULL DEFAULT 'medium',
    "status" "QuestionStatus" NOT NULL DEFAULT 'active',
    "confidence_score" DOUBLE PRECISION,
    "needs_review" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "explanation_feedbacks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "question_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "reason" TEXT,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "explanation_feedbacks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_jobs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "question_set_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "file_type" "ImportFileType" NOT NULL,
    "file_url" TEXT NOT NULL,
    "status" "ImportStatus" NOT NULL DEFAULT 'pending',
    "ai_raw_result" JSONB,
    "parsed_count" INTEGER NOT NULL DEFAULT 0,
    "failed_count" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMPTZ,

    CONSTRAINT "import_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "practice_sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "question_set_id" UUID,
    "mode" "PracticeMode" NOT NULL,
    "total_questions" INTEGER NOT NULL DEFAULT 0,
    "answered" INTEGER NOT NULL DEFAULT 0,
    "correct" INTEGER NOT NULL DEFAULT 0,
    "duration_seconds" INTEGER NOT NULL DEFAULT 0,
    "status" "SessionStatus" NOT NULL DEFAULT 'in_progress',
    "started_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMPTZ,

    CONSTRAINT "practice_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_answers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "session_id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "selected_choice_key" CHAR(1),
    "is_correct" BOOLEAN NOT NULL DEFAULT false,
    "time_spent_ms" INTEGER NOT NULL DEFAULT 0,
    "ai_explanation_viewed" BOOLEAN NOT NULL DEFAULT false,
    "translated" BOOLEAN NOT NULL DEFAULT false,
    "seq_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "session_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_question_stats" (
    "user_id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "correct_count" INTEGER NOT NULL DEFAULT 0,
    "incorrect_streak" INTEGER NOT NULL DEFAULT 0,
    "is_bookmarked" BOOLEAN NOT NULL DEFAULT false,
    "is_flagged" BOOLEAN NOT NULL DEFAULT false,
    "last_attempted_at" TIMESTAMPTZ,
    "difficulty_score" DOUBLE PRECISION NOT NULL DEFAULT 0.5,

    CONSTRAINT "user_question_stats_pkey" PRIMARY KEY ("user_id","question_id")
);

-- CreateTable
CREATE TABLE "user_topic_stats" (
    "user_id" UUID NOT NULL,
    "topic_id" UUID NOT NULL,
    "total_attempted" INTEGER NOT NULL DEFAULT 0,
    "total_correct" INTEGER NOT NULL DEFAULT 0,
    "accuracy" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "last_practiced_at" TIMESTAMPTZ,

    CONSTRAINT "user_topic_stats_pkey" PRIMARY KEY ("user_id","topic_id")
);

-- CreateTable
CREATE TABLE "streak_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "log_date" DATE NOT NULL,
    "questions_done" INTEGER NOT NULL DEFAULT 0,
    "is_streak_day" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "streak_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offline_downloads" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "question_set_id" UUID NOT NULL,
    "downloaded_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ,
    "sync_status" "SyncStatus" NOT NULL DEFAULT 'pending',

    CONSTRAINT "offline_downloads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_auth_provider_provider_id_key" ON "users"("auth_provider", "provider_id");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_user_id_key" ON "subscriptions"("user_id");

-- CreateIndex
CREATE INDEX "ai_usage_logs_user_id_feature_type_created_at_idx" ON "ai_usage_logs"("user_id", "feature_type", "created_at" DESC);

-- CreateIndex
CREATE INDEX "question_sets_owner_id_idx" ON "question_sets"("owner_id");

-- CreateIndex
CREATE INDEX "question_sets_visibility_idx" ON "question_sets"("visibility");

-- CreateIndex
CREATE INDEX "topics_question_set_id_idx" ON "topics"("question_set_id");

-- CreateIndex
CREATE INDEX "questions_question_set_id_idx" ON "questions"("question_set_id");

-- CreateIndex
CREATE INDEX "questions_topic_id_idx" ON "questions"("topic_id");

-- CreateIndex
CREATE INDEX "questions_status_idx" ON "questions"("status");

-- CreateIndex
CREATE INDEX "questions_needs_review_idx" ON "questions"("needs_review");

-- CreateIndex
CREATE INDEX "explanation_feedbacks_resolved_idx" ON "explanation_feedbacks"("resolved");

-- CreateIndex
CREATE UNIQUE INDEX "explanation_feedbacks_question_id_user_id_key" ON "explanation_feedbacks"("question_id", "user_id");

-- CreateIndex
CREATE INDEX "import_jobs_question_set_id_idx" ON "import_jobs"("question_set_id");

-- CreateIndex
CREATE INDEX "import_jobs_user_id_idx" ON "import_jobs"("user_id");

-- CreateIndex
CREATE INDEX "import_jobs_status_idx" ON "import_jobs"("status");

-- CreateIndex
CREATE INDEX "practice_sessions_user_id_idx" ON "practice_sessions"("user_id");

-- CreateIndex
CREATE INDEX "practice_sessions_question_set_id_idx" ON "practice_sessions"("question_set_id");

-- CreateIndex
CREATE INDEX "practice_sessions_started_at_idx" ON "practice_sessions"("started_at" DESC);

-- CreateIndex
CREATE INDEX "session_answers_session_id_idx" ON "session_answers"("session_id");

-- CreateIndex
CREATE INDEX "session_answers_question_id_idx" ON "session_answers"("question_id");

-- CreateIndex
CREATE UNIQUE INDEX "session_answers_session_id_question_id_key" ON "session_answers"("session_id", "question_id");

-- CreateIndex
CREATE INDEX "user_question_stats_user_id_incorrect_streak_idx" ON "user_question_stats"("user_id", "incorrect_streak" DESC);

-- CreateIndex
CREATE INDEX "user_topic_stats_user_id_idx" ON "user_topic_stats"("user_id");

-- CreateIndex
CREATE INDEX "streak_logs_user_id_log_date_idx" ON "streak_logs"("user_id", "log_date" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "streak_logs_user_id_log_date_key" ON "streak_logs"("user_id", "log_date");

-- CreateIndex
CREATE INDEX "offline_downloads_user_id_idx" ON "offline_downloads"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "offline_downloads_user_id_question_set_id_key" ON "offline_downloads"("user_id", "question_set_id");

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_usage_logs" ADD CONSTRAINT "ai_usage_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_sets" ADD CONSTRAINT "question_sets_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "topics" ADD CONSTRAINT "topics_question_set_id_fkey" FOREIGN KEY ("question_set_id") REFERENCES "question_sets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_question_set_id_fkey" FOREIGN KEY ("question_set_id") REFERENCES "question_sets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "explanation_feedbacks" ADD CONSTRAINT "explanation_feedbacks_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "explanation_feedbacks" ADD CONSTRAINT "explanation_feedbacks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_jobs" ADD CONSTRAINT "import_jobs_question_set_id_fkey" FOREIGN KEY ("question_set_id") REFERENCES "question_sets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_jobs" ADD CONSTRAINT "import_jobs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "practice_sessions" ADD CONSTRAINT "practice_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "practice_sessions" ADD CONSTRAINT "practice_sessions_question_set_id_fkey" FOREIGN KEY ("question_set_id") REFERENCES "question_sets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_answers" ADD CONSTRAINT "session_answers_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "practice_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_answers" ADD CONSTRAINT "session_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_question_stats" ADD CONSTRAINT "user_question_stats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_question_stats" ADD CONSTRAINT "user_question_stats_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_topic_stats" ADD CONSTRAINT "user_topic_stats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_topic_stats" ADD CONSTRAINT "user_topic_stats_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "streak_logs" ADD CONSTRAINT "streak_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offline_downloads" ADD CONSTRAINT "offline_downloads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offline_downloads" ADD CONSTRAINT "offline_downloads_question_set_id_fkey" FOREIGN KEY ("question_set_id") REFERENCES "question_sets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
