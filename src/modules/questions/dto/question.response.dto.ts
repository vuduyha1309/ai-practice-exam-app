import { DifficultyLevel, QuestionStatus } from '@prisma/client';

export class QuestionResponseDto {
  id: string;
  content: string | null;
  contentVi: string | null;
  imageUrl: string | null;
  choices: any[];
  explanation: any;
  difficulty: DifficultyLevel;
  status: QuestionStatus;
  confidenceScore: number | null;
  needsReview: boolean;
  topicId: string | null;
  createdAt: Date;
  updatedAt: Date;
}
