import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class AnalyticsRepository {
  constructor(private prisma: PrismaService) {}

  async getOverallStats(userId: string) {
    const [completedSessions, aggregateResult] = await Promise.all([
      this.prisma.client.practiceSession.findMany({
        where: { userId, status: 'completed' },
        select: { durationSeconds: true, correct: true, answered: true },
      }),
      this.prisma.client.practiceSession.aggregate({
        where: { userId, status: 'completed' },
        _sum: { durationSeconds: true, answered: true },
      }),
    ]);

    const totalSessionsCount = completedSessions.length;
    const totalTime = aggregateResult._sum?.durationSeconds || 0;
    const totalAnswered = aggregateResult._sum?.answered || 0;

    // Calculate accuracy
    let totalCorrect = 0;
    completedSessions.forEach((session) => {
      totalCorrect += session.correct;
    });

    const overallAccuracy = totalAnswered > 0 ? (totalCorrect / totalAnswered) * 100 : 0;

    return {
      totalSessions: totalSessionsCount,
      totalQuestionsAnswered: totalAnswered,
      totalCorrect,
      overallAccuracy: Math.round(overallAccuracy * 100) / 100,
      totalTimeHours: Math.round((totalTime / 3600) * 100) / 100,
    };
  }

  async getTopicStats(userId: string) {
    const topicStats = await this.prisma.client.userTopicStat.findMany({
      where: { userId },
      include: {
        topic: {
          select: {
            id: true,
            name: true,
            questionSetId: true,
          },
        },
      },
      orderBy: { accuracy: 'desc' },
    });

    return topicStats.map((stat) => ({
      topicId: stat.topic.id,
      topicName: stat.topic.name,
      questionSetId: stat.topic.questionSetId,
      totalAttempted: stat.totalAttempted,
      totalCorrect: stat.totalCorrect,
      accuracy: Math.round(stat.accuracy * 100) / 100,
      lastPracticedAt: stat.lastPracticedAt,
    }));
  }

  async getWeakAreas(userId: string, limit: number = 5) {
    const weakAreas = await this.prisma.client.userTopicStat.findMany({
      where: { userId },
      include: {
        topic: {
          select: {
            id: true,
            name: true,
            questionSetId: true,
          },
        },
      },
      orderBy: { accuracy: 'asc' },
      take: limit,
    });

    return weakAreas.map((stat) => ({
      topicId: stat.topic.id,
      topicName: stat.topic.name,
      questionSetId: stat.topic.questionSetId,
      totalAttempted: stat.totalAttempted,
      totalCorrect: stat.totalCorrect,
      accuracy: Math.round(stat.accuracy * 100) / 100,
      lastPracticedAt: stat.lastPracticedAt,
    }));
  }

  async getStrengthAreas(userId: string, limit: number = 5) {
    const strengthAreas = await this.prisma.client.userTopicStat.findMany({
      where: { userId },
      include: {
        topic: {
          select: {
            id: true,
            name: true,
            questionSetId: true,
          },
        },
      },
      orderBy: { accuracy: 'desc' },
      take: limit,
    });

    return strengthAreas.map((stat) => ({
      topicId: stat.topic.id,
      topicName: stat.topic.name,
      questionSetId: stat.topic.questionSetId,
      totalAttempted: stat.totalAttempted,
      totalCorrect: stat.totalCorrect,
      accuracy: Math.round(stat.accuracy * 100) / 100,
      lastPracticedAt: stat.lastPracticedAt,
    }));
  }

  async getMostMistakenQuestions(userId: string, limit: number = 10) {
    const questions = await this.prisma.client.userQuestionStat.findMany({
      where: { userId },
      include: {
        question: {
          select: {
            id: true,
            content: true,
            contentVi: true,
            difficulty: true,
            topic: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { incorrectStreak: 'desc' },
      take: limit,
    });

    return questions.map((q) => ({
      questionId: q.question.id,
      content: q.question.content,
      contentVi: q.question.contentVi,
      difficulty: q.question.difficulty,
      topic: q.question.topic,
      attemptCount: q.attemptCount,
      correctCount: q.correctCount,
      accuracy: q.attemptCount > 0 ? Math.round((q.correctCount / q.attemptCount) * 100 * 100) / 100 : 0,
      incorrectStreak: q.incorrectStreak,
      lastAttemptedAt: q.lastAttemptedAt,
    }));
  }

  async getDailyStreak(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get streak logs from last 30 days
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const streakLogs = await this.prisma.client.streakLog.findMany({
      where: {
        userId,
        logDate: {
          gte: thirtyDaysAgo,
          lte: today,
        },
      },
      orderBy: { logDate: 'desc' },
    });

    // Calculate current streak
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let lastDate = null;

    // Get all dates in last 30 days with questions
    const activeDates = new Set(streakLogs.map((log) => log.logDate.toDateString()));

    // Calculate current streak
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      checkDate.setHours(0, 0, 0, 0);

      if (activeDates.has(checkDate.toDateString())) {
        tempStreak++;
      } else {
        if (i === 0) {
          // No activity today
          currentStreak = 0;
        }
        break;
      }
    }
    currentStreak = tempStreak;

    // Calculate longest streak
    tempStreak = 0;
    for (let i = 29; i >= 0; i--) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      checkDate.setHours(0, 0, 0, 0);

      if (activeDates.has(checkDate.toDateString())) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }

    // Get total questions in last 7 days
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const last7Days = await this.prisma.client.streakLog.findMany({
      where: {
        userId,
        logDate: {
          gte: sevenDaysAgo,
          lte: today,
        },
      },
    });

    const questionsLast7Days = last7Days.reduce((sum, log) => sum + log.questionsDone, 0);

    return {
      currentStreak,
      longestStreak,
      questionsLast7Days,
      streakHistory: streakLogs.map((log) => ({
        date: log.logDate,
        questionsDone: log.questionsDone,
        isStreakDay: log.isStreakDay,
      })),
    };
  }

  async getRecentSessions(userId: string, limit: number = 5) {
    const sessions = await this.prisma.client.practiceSession.findMany({
      where: { userId, status: 'completed' },
      include: {
        questionSet: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { endedAt: 'desc' },
      take: limit,
    });

    return sessions.map((session) => ({
      sessionId: session.id,
      mode: session.mode,
      questionSetTitle: session.questionSet?.title || 'Deleted Set',
      totalQuestions: session.totalQuestions,
      answered: session.answered,
      correct: session.correct,
      accuracy: session.answered > 0 ? Math.round((session.correct / session.answered) * 100 * 100) / 100 : 0,
      durationMinutes: Math.round(session.durationSeconds / 60),
      startedAt: session.startedAt,
      endedAt: session.endedAt,
    }));
  }

  async getDifficultyDistribution(userId: string) {
    const stats = await this.prisma.client.userQuestionStat.groupBy({
      by: ['questionId'],
      where: { userId },
      _count: { questionId: true },
    });

    // Get difficulty for each question
    const questionIds = stats.map((s) => s.questionId);
    const questions = await this.prisma.client.question.findMany({
      where: { id: { in: questionIds } },
      select: { id: true, difficulty: true },
    });

    const difficultyMap = new Map(questions.map((q) => [q.id, q.difficulty]));

    const distribution = {
      easy: 0,
      medium: 0,
      hard: 0,
    };

    stats.forEach((stat) => {
      const difficulty = difficultyMap.get(stat.questionId)?.toLowerCase();
      if (difficulty === 'easy') distribution.easy++;
      else if (difficulty === 'medium') distribution.medium++;
      else if (difficulty === 'hard') distribution.hard++;
    });

    return distribution;
  }

  async getAccuracyByDifficulty(userId: string) {
    const stats = await this.prisma.client.userQuestionStat.findMany({
      where: { userId },
      include: {
        question: {
          select: {
            difficulty: true,
          },
        },
      },
    });

    const byDifficulty = {
      easy: { total: 0, correct: 0, accuracy: 0 },
      medium: { total: 0, correct: 0, accuracy: 0 },
      hard: { total: 0, correct: 0, accuracy: 0 },
    };

    stats.forEach((stat) => {
      const difficulty = stat.question.difficulty.toLowerCase();
      if (byDifficulty[difficulty]) {
        byDifficulty[difficulty].total += stat.attemptCount;
        byDifficulty[difficulty].correct += stat.correctCount;
      }
    });

    // Calculate accuracy for each difficulty
    Object.keys(byDifficulty).forEach((key) => {
      const data = byDifficulty[key];
      data.accuracy = data.total > 0 ? Math.round((data.correct / data.total) * 100 * 100) / 100 : 0;
    });

    return byDifficulty;
  }

  async getSessionModeStats(userId: string) {
    const sessions = await this.prisma.client.practiceSession.findMany({
      where: { userId, status: 'completed' },
      select: {
        mode: true,
        correct: true,
        answered: true,
        durationSeconds: true,
      },
    });

    const modeStats = {
      quick: { sessions: 0, totalQuestions: 0, totalCorrect: 0, accuracy: 0, avgTimeSeconds: 0 },
      deep: { sessions: 0, totalQuestions: 0, totalCorrect: 0, accuracy: 0, avgTimeSeconds: 0 },
      exam: { sessions: 0, totalQuestions: 0, totalCorrect: 0, accuracy: 0, avgTimeSeconds: 0 },
      weakness: { sessions: 0, totalQuestions: 0, totalCorrect: 0, accuracy: 0, avgTimeSeconds: 0 },
    };

    const modeTime = { quick: 0, deep: 0, exam: 0, weakness: 0 };

    sessions.forEach((session) => {
      const mode = session.mode.toLowerCase();
      if (modeStats[mode]) {
        modeStats[mode].sessions++;
        modeStats[mode].totalQuestions += session.answered;
        modeStats[mode].totalCorrect += session.correct;
        modeTime[mode] += session.durationSeconds;
      }
    });

    // Calculate accuracy and average time
    Object.keys(modeStats).forEach((mode) => {
      const data = modeStats[mode];
      if (data.totalQuestions > 0) {
        data.accuracy = Math.round((data.totalCorrect / data.totalQuestions) * 100 * 100) / 100;
        data.avgTimeSeconds = Math.round(modeTime[mode] / data.sessions);
      }
    });

    return Object.fromEntries(Object.entries(modeStats).filter(([, v]) => v.sessions > 0));
  }
}
