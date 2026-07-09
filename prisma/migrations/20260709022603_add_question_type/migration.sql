/*
  Warnings:

  - You are about to drop the column `selected_choice_key` on the `session_answers` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('single_choice', 'multiple_choice');

-- AlterTable
ALTER TABLE "questions" ADD COLUMN     "question_type" "QuestionType" NOT NULL DEFAULT 'single_choice';

-- AlterTable
ALTER TABLE "session_answers" DROP COLUMN "selected_choice_key",
ADD COLUMN     "selected_choice_keys" TEXT;

-- CreateIndex
CREATE INDEX "questions_question_type_idx" ON "questions"("question_type");
