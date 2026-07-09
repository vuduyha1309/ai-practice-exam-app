import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ExplanationFeedback } from '@prisma/client';

@Injectable()
export class ExplanationFeedbackRepository {
  constructor(private prisma: PrismaService) {}

  async findByQuestionAndUser(questionId: string, userId: string): Promise<ExplanationFeedback | null> {
    return this.prisma.client.explanationFeedback.findUnique({
      where: {
        questionId_userId: { questionId, userId },
      },
    });
  }

  async create(questionId: string, userId: string, reason?: string): Promise<ExplanationFeedback> {
    return this.prisma.client.explanationFeedback.create({
      data: {
        questionId,
        userId,
        reason,
      },
    });
  }

  async update(questionId: string, userId: string, reason?: string): Promise<ExplanationFeedback> {
    return this.prisma.client.explanationFeedback.update({
      where: {
        questionId_userId: { questionId, userId },
      },
      data: { reason },
    });
  }
}
