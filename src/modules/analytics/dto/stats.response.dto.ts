export class OverallStatsDto {
  totalSessions: number;
  totalQuestionsAnswered: number;
  totalCorrect: number;
  overallAccuracy: number;
  totalTimeHours: number;
}

export class TopicStatDto {
  topicId: string;
  topicName: string;
  questionSetId: string;
  totalAttempted: number;
  totalCorrect: number;
  accuracy: number;
  lastPracticedAt: Date | null;
}

export class WeakAreaDto extends TopicStatDto {}

export class StrengthAreaDto extends TopicStatDto {}

export class MistakenQuestionDto {
  questionId: string;
  content: string;
  contentVi: string;
  difficulty: string;
  topic: {
    id: string;
    name: string;
  } | null;
  attemptCount: number;
  correctCount: number;
  accuracy: number;
  incorrectStreak: number;
  lastAttemptedAt: Date | null;
}

export class StreakDto {
  currentStreak: number;
  longestStreak: number;
  questionsLast7Days: number;
  streakHistory: Array<{
    date: Date;
    questionsDone: number;
    isStreakDay: boolean;
  }>;
}

export class RecentSessionDto {
  sessionId: string;
  mode: string;
  questionSetTitle: string;
  totalQuestions: number;
  answered: number;
  correct: number;
  accuracy: number;
  durationMinutes: number;
  startedAt: Date;
  endedAt: Date | null;
}

export class DifficultyDistributionDto {
  easy: number;
  medium: number;
  hard: number;
}

export class AccuracyByDifficultyDto {
  [key: string]: {
    total: number;
    correct: number;
    accuracy: number;
  };
}

export class SessionModeStatsDto {
  [key: string]: {
    sessions: number;
    totalQuestions: number;
    totalCorrect: number;
    accuracy: number;
    avgTimeSeconds: number;
  };
}

export class UserStatsResponseDto {
  overall: OverallStatsDto;
  topics: TopicStatDto[];
  weakAreas: WeakAreaDto[];
  strengthAreas: StrengthAreaDto[];
  streak: StreakDto;
  recentSessions: RecentSessionDto[];
  difficulty: {
    distribution: DifficultyDistributionDto;
    accuracyByDifficulty: AccuracyByDifficultyDto;
  };
  sessionModes: SessionModeStatsDto;
}
