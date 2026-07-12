import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { CreateTopicDto } from '../dto/create-topic.dto';
import { UpdateTopicDto } from '../dto/update-topic.dto';
import { ConfirmTopicDto } from '../dto/confirm-topic.dto';
import { TopicResponseDto } from '../dto/topic.response.dto';
import { TopicRepository } from '../repositories/topic.repository';
import { QuestionSetRepository } from '../../repositories/question-set.repository';

@Injectable()
export class TopicsService {
  constructor(
    private topicRepository: TopicRepository,
    private questionSetRepository: QuestionSetRepository,
  ) {}

  async create(setId: string, dto: CreateTopicDto, userId: string): Promise<TopicResponseDto> {
    // Check if user owns the question set
    const set = await this.questionSetRepository.findById(setId);
    if (!set) {
      throw new NotFoundException('Bộ đề không tồn tại');
    }
    if (set.ownerId !== userId) {
      throw new ForbiddenException('Không có quyền tạo topic trong bộ đề này');
    }

    // Calculate sortOrder
    const maxSortOrder = await this.topicRepository.findMaxSortOrderBySetId(setId);
    const sortOrder = dto.sortOrder ?? maxSortOrder + 1;

    const topic = await this.topicRepository.create({
      name: dto.name,
      sortOrder,
      confirmedByUser: true, // User-created topic is immediately confirmed
      questionSet: { connect: { id: setId } },
    });

    return this.mapToResponseDto(topic, 0);
  }

  async findAll(setId: string, userId: string): Promise<TopicResponseDto[]> {
    // Check if user can read the question set
    const set = await this.questionSetRepository.findById(setId);
    if (!set) {
      throw new NotFoundException('Bộ đề không tồn tại');
    }

    // Check permission to read set
    const { VisibilityType } = await import('@prisma/client');
    if (set.ownerId !== userId && set.visibility === VisibilityType.private) {
      throw new ForbiddenException('Không có quyền xem topics của bộ đề này');
    }

    const topics = await this.topicRepository.findBySetId(setId);
    return topics.map((topic: any) => this.mapToResponseDto(topic, topic._count?.questions ?? 0));
  }

  async findOne(setId: string, topicId: string, userId: string): Promise<TopicResponseDto> {
    // Check if user can read the question set
    const set = await this.questionSetRepository.findById(setId);
    if (!set) {
      throw new NotFoundException('Bộ đề không tồn tại');
    }

    // Check permission to read set
    const { VisibilityType } = await import('@prisma/client');
    if (set.ownerId !== userId && set.visibility === VisibilityType.private) {
      throw new ForbiddenException('Không có quyền xem topic này');
    }

    // Check if topic belongs to this set
    const belongsToSet = await this.topicRepository.belongsToSet(topicId, setId);
    if (!belongsToSet) {
      throw new NotFoundException('Topic không thuộc bộ đề này');
    }

    const topic = await this.topicRepository.findByIdWithCount(topicId);
    if (!topic) {
      throw new NotFoundException('Topic không tồn tại');
    }

    return this.mapToResponseDto(topic, topic._count?.questions ?? 0);
  }

  async update(setId: string, topicId: string, dto: UpdateTopicDto, userId: string): Promise<TopicResponseDto> {
    // Check set ownership
    const set = await this.questionSetRepository.findById(setId);
    if (!set) {
      throw new NotFoundException('Bộ đề không tồn tại');
    }
    if (set.ownerId !== userId) {
      throw new ForbiddenException('Không có quyền cập nhật topic');
    }

    // Check if topic belongs to this set
    const belongsToSet = await this.topicRepository.belongsToSet(topicId, setId);
    if (!belongsToSet) {
      throw new NotFoundException('Topic không thuộc bộ đề này');
    }

    const updateData: Record<string, any> = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.sortOrder !== undefined) updateData.sortOrder = dto.sortOrder;

    const topic = await this.topicRepository.update(topicId, updateData);

    return this.mapToResponseDto(topic, 0);
  }

  async confirm(
    setId: string,
    topicId: string,
    dto: ConfirmTopicDto,
    userId: string,
  ): Promise<TopicResponseDto> {
    // Check set ownership
    const set = await this.questionSetRepository.findById(setId);
    if (!set) {
      throw new NotFoundException('Bộ đề không tồn tại');
    }
    if (set.ownerId !== userId) {
      throw new ForbiddenException('Không có quyền confirm topic');
    }

    // Check if topic belongs to this set
    const belongsToSet = await this.topicRepository.belongsToSet(topicId, setId);
    if (!belongsToSet) {
      throw new NotFoundException('Topic không thuộc bộ đề này');
    }

    // Update topic - idempotent operation
    const topic = await this.topicRepository.update(topicId, {
      confirmedByUser: true,
      name: dto.name, // If name provided, update it; otherwise keep existing
    });

    return this.mapToResponseDto(topic, 0);
  }

  async remove(setId: string, topicId: string, userId: string): Promise<void> {
    // Check set ownership
    const set = await this.questionSetRepository.findById(setId);
    if (!set) {
      throw new NotFoundException('Bộ đề không tồn tại');
    }
    if (set.ownerId !== userId) {
      throw new ForbiddenException('Không có quyền xóa topic');
    }

    // Check if topic belongs to this set
    const belongsToSet = await this.topicRepository.belongsToSet(topicId, setId);
    if (!belongsToSet) {
      throw new NotFoundException('Topic không thuộc bộ đề này');
    }

    // Delete all questions with this topic first, then delete topic
    await this.topicRepository.deleteTopicWithQuestions(topicId);
  }

  private mapToResponseDto(topic: any, questionCount: number): TopicResponseDto {
    return {
      id: topic.id,
      name: topic.name,
      aiSuggestedName: topic.aiSuggestedName,
      confirmedByUser: topic.confirmedByUser,
      sortOrder: topic.sortOrder,
      questionCount,
      createdAt: topic.createdAt,
    };
  }
}
