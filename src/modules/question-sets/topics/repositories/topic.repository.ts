import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { Prisma, Topic } from '@prisma/client';

@Injectable()
export class TopicRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.TopicCreateInput): Promise<Topic> {
    return this.prisma.client.topic.create({ data });
  }

  async findById(id: string): Promise<Topic | null> {
    return this.prisma.client.topic.findUnique({ where: { id } });
  }

  async findByIdWithCount(id: string) {
    return this.prisma.client.topic.findUnique({
      where: { id },
      include: {
        _count: {
          select: { questions: true },
        },
      },
    });
  }

  async findBySetId(setId: string) {
    return this.prisma.client.topic.findMany({
      where: { questionSetId: setId },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { questions: true },
        },
      },
    });
  }

  async findMaxSortOrderBySetId(setId: string): Promise<number> {
    const result = await this.prisma.client.topic.findFirst({
      where: { questionSetId: setId },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });
    return result?.sortOrder ?? -1;
  }

  async update(id: string, data: Prisma.TopicUpdateInput): Promise<Topic> {
    return this.prisma.client.topic.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<Topic> {
    return this.prisma.client.topic.delete({ where: { id } });
  }

  async belongsToSet(topicId: string, setId: string): Promise<boolean> {
    const topic = await this.prisma.client.topic.findFirst({
      where: { id: topicId, questionSetId: setId },
    });
    return !!topic;
  }
}
