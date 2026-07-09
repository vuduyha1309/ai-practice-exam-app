import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Prisma, QuestionSet, VisibilityType } from '@prisma/client';

@Injectable()
export class QuestionSetRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.QuestionSetCreateInput): Promise<QuestionSet> {
    return this.prisma.client.questionSet.create({ data });
  }

  async findById(id: string): Promise<QuestionSet | null> {
    return this.prisma.client.questionSet.findUnique({ where: { id } });
  }

  async findMany(
    userId: string,
    filters: {
      page: number;
      limit: number;
      visibility?: VisibilityType;
      search?: string;
    },
  ): Promise<{ sets: QuestionSet[]; total: number }> {
    const { page, limit, visibility, search } = filters;
    const skip = (page - 1) * Math.min(limit, 100);
    const take = Math.min(limit, 100);

    // Build where clause
    const where: Prisma.QuestionSetWhereInput = {
      OR: [
        { ownerId: userId }, // User's own sets
        { visibility: VisibilityType.public }, // Public sets
      ],
    };

    if (visibility) {
      where.visibility = visibility;
    }

    if (search) {
      where.OR = (where.OR as Prisma.QuestionSetWhereInput[]).map((or) => ({
        ...or,
        title: { contains: search, mode: 'insensitive' as const },
      }));
    }

    const [sets, total] = await Promise.all([
      this.prisma.client.questionSet.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { questions: true, topics: true },
          },
        },
      }),
      this.prisma.client.questionSet.count({ where }),
    ]);

    return { sets: sets as QuestionSet[], total };
  }

  async update(id: string, data: Prisma.QuestionSetUpdateInput): Promise<QuestionSet> {
    return this.prisma.client.questionSet.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<QuestionSet> {
    return this.prisma.client.questionSet.delete({ where: { id } });
  }

  async countActiveSessions(setId: string): Promise<number> {
    return this.prisma.client.practiceSession.count({
      where: {
        questionSetId: setId,
        status: 'in_progress',
      },
    });
  }
}
