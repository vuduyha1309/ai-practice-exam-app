import { ParseResult, Question as AiQuestion } from '../ai/ai.service';
import { DifficultyLevel } from '@prisma/client';

export interface TopicMap {
  [name: string]: string; // name -> id
}

export interface QuestionToCreate {
  questionSetId: string;
  topicId: string | null;
  content: string;
  choices: any[];
  explanation: any;
  difficulty: DifficultyLevel;
  confidenceScore: number;
  needsReview: boolean;
  sortOrder: number;
}

export function buildQuestionsFromAiResult(
  setId: string,
  result: ParseResult,
  topicMap: TopicMap,
): QuestionToCreate[] {
  return result.questions.map((q: AiQuestion, index: number) => ({
    questionSetId: setId,
    topicId: topicMap[q.suggestedTopic] ?? null,
    content: q.content,
    choices: q.choices,
    explanation: {
      content: q.explanation,
      source: 'ai',
      isVerified: false,
      confidenceScore: q.confidenceScore,
      reportCount: 0,
    },
    difficulty: mapDifficulty(q.difficulty),
    confidenceScore: q.confidenceScore,
    needsReview: q.confidenceScore < 0.75,
    sortOrder: index,
  }));
}

function mapDifficulty(difficulty: string): DifficultyLevel {
  const map: Record<string, DifficultyLevel> = {
    easy: DifficultyLevel.easy,
    medium: DifficultyLevel.medium,
    hard: DifficultyLevel.hard,
  };
  return map[difficulty.toLowerCase()] ?? DifficultyLevel.medium;
}

export function validateChoices(choices: any[]): boolean {
  if (!Array.isArray(choices) || choices.length === 0) return false;
  return choices.some((c) => c.isCorrect === true);
}
