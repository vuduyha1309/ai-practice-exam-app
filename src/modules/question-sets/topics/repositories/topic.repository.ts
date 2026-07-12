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

  async deleteTopicWithQuestions(topicId: string): Promise<void> {
    // Delete all session answers referencing this topic's sessions
    await this.prisma.client.sessionAnswer.deleteMany({
      where: {
        session: {
          topicId,
        },
      },
    });

    // Delete all practice sessions with this topic
    await this.prisma.client.practiceSession.deleteMany({
      where: { topicId },
    });

    // Delete all questions with this topic
    await this.prisma.client.question.deleteMany({
      where: { topicId },
    });

    // Delete all user topic stats with this topic
    await this.prisma.client.userTopicStat.deleteMany({
      where: { topicId },
    });

    // Finally delete the topic itself
    await this.prisma.client.topic.delete({
      where: { id: topicId },
    });
  }

  async belongsToSet(topicId: string, setId: string): Promise<boolean> {
    const topic = await this.prisma.client.topic.findFirst({
      where: { id: topicId, questionSetId: setId },
    });
    return !!topic;
  }
}
