import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { CreateQuestionSetDto } from '../dto/create-question-set.dto';
import { UpdateQuestionSetDto } from '../dto/update-question-set.dto';
import { QuestionSetRepository } from '../repositories/question-set.repository';
import { QuestionSetResponseDto, QuestionSetsPaginatedResponseDto } from '../dto/question-set.response.dto';
import { ParseStatus, VisibilityType } from '@prisma/client';

@Injectable()
export class QuestionSetsService {
  constructor(private questionSetRepository: QuestionSetRepository) {}

  async create(dto: CreateQuestionSetDto, userId: string): Promise<QuestionSetResponseDto> {
    const set = await this.questionSetRepository.create({
      title: dto.title,
      description: dto.description ?? null,
      visibility: dto.visibility ?? VisibilityType.private,
      sourceType: dto.sourceType,
      aiParseStatus: ParseStatus.pending,
      owner: { connect: { id: userId } },
    });

    return this.mapToResponseDto(set, 0, 0);
  }

  async findAll(
    userId: string,
    page: number = 1,
    limit: number = 20,
    visibility?: VisibilityType,
    search?: string,
  ): Promise<QuestionSetsPaginatedResponseDto> {
    const { sets, total } = await this.questionSetRepository.findMany(userId, {
      page,
      limit,
      visibility,
      search,
    });

    const data = sets.map((set) => {
      const questionCount = (set as any)._count?.questions ?? 0;
      const topicCount = (set as any)._count?.topics ?? 0;
      return this.mapToResponseDto(set, questionCount, topicCount);
    });

    return {
      data,
      meta: {
        total,
        page,
        limit: Math.min(limit, 100),
      },
    };
  }

  async findOne(id: string, userId: string): Promise<QuestionSetResponseDto> {
    const set = await this.questionSetRepository.findByIdWithCount(id);
    if (!set) {
      throw new NotFoundException('Bộ đề không tồn tại');
    }
    if ((set as any).ownerId !== userId && (set as any).visibility === VisibilityType.private) {
      throw new ForbiddenException('Không có quyền truy cập');
    }
    const questionCount = (set as any)._count?.questions ?? 0;
    const topicCount = (set as any)._count?.topics ?? 0;
    return this.mapToResponseDto(set, questionCount, topicCount);
  }

  async update(id: string, dto: UpdateQuestionSetDto, userId: string): Promise<QuestionSetResponseDto> {
    await this.assertOwner(id, userId);

    const updateData: Record<string, any> = {};
    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.visibility !== undefined) updateData.visibility = dto.visibility;
    if (dto.sourceType !== undefined) updateData.sourceType = dto.sourceType;

    const set = await this.questionSetRepository.update(id, updateData);

    return this.mapToResponseDto(set, 0, 0);
  }

  async remove(id: string, userId: string): Promise<void> {
    const set = await this.assertOwner(id, userId);

    // Xóa tất cả data liên quan (cascade delete)
    await this.questionSetRepository.deleteWithCascade(id);
  }

  // Helper methods
  private async assertOwner(setId: string, userId: string) {
    const set = await this.questionSetRepository.findById(setId);
    if (!set) {
      throw new NotFoundException('Bộ đề không tồn tại');
    }
    if (set.ownerId !== userId) {
      throw new ForbiddenException('Không có quyền truy cập');
    }
    return set;
  }

  private async assertCanRead(setId: string, userId: string) {
    const set = await this.questionSetRepository.findById(setId);
    if (!set) {
      throw new NotFoundException('Bộ đề không tồn tại');
    }
    if (set.ownerId !== userId && set.visibility === VisibilityType.private) {
      throw new ForbiddenException('Không có quyền truy cập');
    }
    return set;
  }

  private mapToResponseDto(set: any, questionCount: number, topicCount: number): QuestionSetResponseDto {
    return {
      id: set.id,
      title: set.title,
      description: set.description,
      visibility: set.visibility,
      sourceType: set.sourceType,
      aiParseStatus: set.aiParseStatus,
      questionCount,
      topicCount,
      createdAt: set.createdAt,
      updatedAt: set.updatedAt,
    };
  }
}
