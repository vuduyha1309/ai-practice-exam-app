import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Prisma, Question } from '@prisma/client';

@Injectable()
export class QuestionRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.client.question.findUnique({ where: { id } });
  }

  async findBySetId(
    setId: string,
    filters?: {
      page?: number;
      limit?: number;
      needsReview?: boolean;
    },
  ) {
    const skip = filters?.page ? (filters.page - 1) * (filters.limit || 20) : undefined;
    const take = filters?.limit || 20;

    const where: Prisma.QuestionWhereInput = { questionSetId: setId };
    if (filters?.needsReview !== undefined) {
      where.needsReview = filters.needsReview;
    }

    const [questions, total] = await Promise.all([
      this.prisma.client.question.findMany({
        where,
        skip,
        take,
        orderBy: { sortOrder: 'asc' },
      }),
      this.prisma.client.question.count({ where }),
    ]);

    return { questions, total };
  }

  async update(id: string, data: Prisma.QuestionUpdateInput): Promise<Question> {
    return this.prisma.client.question.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<Question> {
    return this.prisma.client.question.delete({ where: { id } });
  }

  async belongsToSet(questionId: string, setId: string): Promise<boolean> {
    const question = await this.prisma.client.question.findFirst({
      where: { id: questionId, questionSetId: setId },
    });
    return !!question;
  }

  async topicBelongsToSet(topicId: string, setId: string): Promise<boolean> {
    const topic = await this.prisma.client.topic.findFirst({
      where: { id: topicId, questionSetId: setId },
    });
    return !!topic;
  }

  async findMany(filters: {
    where: Prisma.QuestionWhereInput;
    take?: number;
    skip?: number;
    orderBy?: Prisma.QuestionOrderByWithRelationInput;
  }) {
    return this.prisma.client.question.findMany({
      where: filters.where,
      take: filters.take,
      skip: filters.skip,
      orderBy: filters.orderBy,
    });
  }
}
