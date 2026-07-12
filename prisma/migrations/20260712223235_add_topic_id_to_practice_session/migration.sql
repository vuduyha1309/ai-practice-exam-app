-- Add topicId field to practice_sessions table
ALTER TABLE "practice_sessions" ADD COLUMN "topic_id" UUID;

-- Add foreign key constraint
ALTER TABLE "practice_sessions" ADD CONSTRAINT "practice_sessions_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add index for topic_id
CREATE INDEX "practice_sessions_topic_id_idx" ON "practice_sessions"("topic_id");
