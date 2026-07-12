import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Prisma, ImportJob, ImportStatus } from '@prisma/client';

@Injectable()
export class ImportJobRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.ImportJobCreateInput): Promise<ImportJob> {
    return this.prisma.client.importJob.create({ data });
  }

  async findById(id: string) {
    return this.prisma.client.importJob.findUnique({ where: { id } });
  }

  async findBySetId(setId: string) {
    return this.prisma.client.importJob.findMany({
      where: { questionSetId: setId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, data: Prisma.ImportJobUpdateInput): Promise<ImportJob> {
    return this.prisma.client.importJob.update({
      where: { id },
      data,
    });
  }

  async findActiveJob(setId: string): Promise<ImportJob | null> {
    return this.prisma.client.importJob.findFirst({
      where: {
        questionSetId: setId,
        status: {
          in: [ImportStatus.pending, ImportStatus.processing],
        },
      },
    });
  }

  async countBySetId(setId: string): Promise<number> {
    return this.prisma.client.importJob.count({
      where: { questionSetId: setId },
    });
  }

  async delete(id: string): Promise<ImportJob> {
    return this.prisma.client.importJob.delete({
      where: { id },
    });
  }
}
