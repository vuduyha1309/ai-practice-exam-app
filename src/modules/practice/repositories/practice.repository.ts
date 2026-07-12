import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Prisma, PracticeSession, SessionAnswer } from '@prisma/client';

@Injectable()
export class PracticeRepository {
  constructor(private prisma: PrismaService) {}

  async createSession(data: Prisma.PracticeSessionCreateInput): Promise<PracticeSession> {
    return this.prisma.client.practiceSession.create({ data });
  }

  async findSessionById(id: string) {
    return this.prisma.client.practiceSession.findUnique({
      where: { id },
      include: { answers: { orderBy: { seqOrder: 'asc' } } },
    });
  }

  async updateSession(id: string, data: Prisma.PracticeSessionUpdateInput): Promise<PracticeSession> {
    return this.prisma.client.practiceSession.update({
      where: { id },
      data,
    });
  }

  async createAnswer(data: Prisma.SessionAnswerCreateInput): Promise<SessionAnswer> {
    return this.prisma.client.sessionAnswer.create({ data });
  }

  async findAnswerInSession(sessionId: string, questionId: string) {
    return this.prisma.client.sessionAnswer.findUnique({
      where: { sessionId_questionId: { sessionId, questionId } },
    });
  }

  async updateAnswer(sessionId: string, questionId: string, data: Prisma.SessionAnswerUpdateInput) {
    return this.prisma.client.sessionAnswer.update({
      where: { sessionId_questionId: { sessionId, questionId } },
      data,
    });
  }

  async getUserSessions(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [sessions, total] = await Promise.all([
      this.prisma.client.practiceSession.findMany({
        where: {
          userId,
          status: 'completed',
          questionSet: {
            isNot: null,
          },
        },
        include: {
          questionSet: {
            select: { title: true },
          },
        },
        skip,
        take: limit,
        orderBy: { startedAt: 'desc' },
      }),
      this.prisma.client.practiceSession.count({
        where: {
          userId,
          status: 'completed',
          questionSet: {
            isNot: null,
          },
        },
      }),
    ]);

    return { sessions, total };
  }

  async getQuestionsBySet(setId: string, limit: number = 100) {
    return this.prisma.client.question.findMany({
      where: { questionSetId: setId, status: 'active' },
      take: limit,
      orderBy: { sortOrder: 'asc' },
    });
  }

  async updateUserQuestionStat(
    userId: string,
    questionId: string,
    isCorrect: boolean,
  ) {
    return this.prisma.client.userQuestionStat.upsert({
      where: { userId_questionId: { userId, questionId } },
      update: {
        attemptCount: { increment: 1 },
        correctCount: isCorrect ? { increment: 1 } : undefined,
        incorrectStreak: isCorrect ? 0 : { increment: 1 },
        lastAttemptedAt: new Date(),
      },
      create: {
        userId,
        questionId,
        attemptCount: 1,
        correctCount: isCorrect ? 1 : 0,
        incorrectStreak: isCorrect ? 0 : 1,
        lastAttemptedAt: new Date(),
      },
    });
  }

  async updateUserTopicStat(userId: string, topicId: string, isCorrect: boolean) {
    const stat = await this.prisma.client.userTopicStat.findUnique({
      where: { userId_topicId: { userId, topicId } },
    });

    const newTotal = (stat?.totalAttempted || 0) + 1;
    const newCorrect = (stat?.totalCorrect || 0) + (isCorrect ? 1 : 0);
    const accuracy = (newCorrect / newTotal) * 100;

    return this.prisma.client.userTopicStat.upsert({
      where: { userId_topicId: { userId, topicId } },
      update: {
        totalAttempted: { increment: 1 },
        totalCorrect: isCorrect ? { increment: 1 } : undefined,
        accuracy,
        lastPracticedAt: new Date(),
      },
      create: {
        userId,
        topicId,
        totalAttempted: 1,
        totalCorrect: isCorrect ? 1 : 0,
        accuracy,
        lastPracticedAt: new Date(),
      },
    });
  }

  async recordStreakLog(userId: string, questionsDone: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.prisma.client.streakLog.upsert({
      where: { userId_logDate: { userId, logDate: today } },
      update: {
        questionsDone: { increment: questionsDone },
        isStreakDay: true,
      },
      create: {
        userId,
        logDate: today,
        questionsDone,
        isStreakDay: true,
      },
    });
  }

  async getWeakTopics(userId: string, limit: number = 5) {
    return this.prisma.client.userTopicStat.findMany({
      where: { userId },
      orderBy: { accuracy: 'asc' },
      take: limit,
      select: { topicId: true, accuracy: true },
    });
  }

  async getMostMistakenQuestions(userId: string, setId: string, limit: number = 20) {
    return this.prisma.client.userQuestionStat.findMany({
      where: {
        userId,
        question: { questionSetId: setId },
      },
      include: { question: true },
      orderBy: { incorrectStreak: 'desc' },
      take: limit,
    });
  }

  async getQuestionsByTopics(setId: string, topicIds: string[], limit: number = 50) {
    return this.prisma.client.question.findMany({
      where: {
        questionSetId: setId,
        topicId: { in: topicIds },
        status: 'active',
      },
      take: limit,
      orderBy: [{ topicId: 'asc' }, { sortOrder: 'asc' }],
    });
  }

  async getQuestionsByDifficulty(setId: string, difficulty: string, limit: number = 50) {
    const difficultyEnum = difficulty.toLowerCase() as 'easy' | 'medium' | 'hard';
    return this.prisma.client.question.findMany({
      where: {
        questionSetId: setId,
        difficulty: difficultyEnum,
        status: 'active',
      },
      take: limit,
      orderBy: { sortOrder: 'asc' },
    });
  }

  async getQuestionsByTopic(setId: string, topicId: string, limit: number = 50) {
    return this.prisma.client.question.findMany({
      where: {
        questionSetId: setId,
        topicId,
        status: 'active',
      },
      take: limit,
      orderBy: { sortOrder: 'asc' },
    });
  }

  async getTopicById(topicId: string) {
    return this.prisma.client.topic.findUnique({
      where: { id: topicId },
    });
  }
}
