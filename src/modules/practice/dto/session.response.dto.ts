import { SessionStatus, PracticeMode } from '@prisma/client';

export class ChoiceDetailsDto {
  key: string;
  content: string;
  contentVi?: string;
  isCorrect: boolean;
}

export class SessionAnswerDetailDto {
  id: string;
  questionId: string;
  content: string;
  contentVi?: string;
  choices: ChoiceDetailsDto[];
  explanation?: any;
  difficulty: string;
  topic?: {
    id: string;
    name: string;
  };
  selectedChoiceKey: string | null;
  correctChoiceKey: string;
  isCorrect: boolean;
  timeSpentMs: number;
  aiExplanationViewed: boolean;
  seqOrder: number;
}

export class SessionReviewDto {
  id: string;
  userId: string;
  questionSetId: string | null;
  questionSetTitle?: string;
  mode: PracticeMode;
  totalQuestions: number;
  answered: number;
  correct: number;
  accuracy: number; // correct / answered * 100
  durationSeconds: number;
  status: SessionStatus;
  startedAt: Date;
  endedAt: Date | null;
  answers: SessionAnswerDetailDto[];
}

export class SessionResponseDto {
  id: string;
  userId: string;
  questionSetId: string | null;
  mode: PracticeMode;
  totalQuestions: number;
  answered: number;
  correct: number;
  accuracy: number; // correct / answered * 100
  durationSeconds: number;
  status: SessionStatus;
  startedAt: Date;
  endedAt: Date | null;
  answers?: any[];
}
