import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { QuestionRepository } from '../repositories/question.repository';
import { ExplanationFeedbackRepository } from '../repositories/explanation-feedback.repository';
import { QuestionSetRepository } from '../../question-sets/repositories/question-set.repository';
import { AiService } from '../../ai/ai.service';
import { UpdateQuestionDto, ChoiceDto } from '../dto/update-question.dto';
import { UpdateExplanationDto } from '../dto/update-explanation.dto';
import { ReportExplanationDto } from '../dto/report-explanation.dto';
import { QuestionResponseDto } from '../dto/question.response.dto';

@Injectable()
export class QuestionsService {
  constructor(
    private questionRepository: QuestionRepository,
    private feedbackRepository: ExplanationFeedbackRepository,
    private questionSetRepository: QuestionSetRepository,
    private aiService: AiService,
  ) {}

  async findAll(
    setId: string,
    userId: string,
    page: number = 1,
    limit: number = 20,
    needsReview?: boolean,
  ) {
    // Verify user owns the set
    const set = await this.questionSetRepository.findById(setId);
    if (!set) {
      throw new NotFoundException('Bộ đề không tồn tại');
    }
    if (set.ownerId !== userId) {
      throw new ForbiddenException('Không có quyền xem câu hỏi');
    }

    const { questions, total } = await this.questionRepository.findBySetId(setId, {
      page,
      limit,
      needsReview,
    });

    const data = questions.map((q: any) => this.mapToResponseDto(q));

    return {
      data,
      meta: { total, page, limit },
    };
  }

  async findOne(setId: string, questionId: string, userId: string): Promise<QuestionResponseDto> {
    // Verify user owns the set
    const set = await this.questionSetRepository.findById(setId);
    if (!set) {
      throw new NotFoundException('Bộ đề không tồn tại');
    }
    if (set.ownerId !== userId) {
      throw new ForbiddenException('Không có quyền xem câu hỏi');
    }

    // Verify question belongs to set
    const question = await this.questionRepository.findById(questionId);
    if (!question || question.questionSetId !== setId) {
      throw new NotFoundException('Câu hỏi không tồn tại');
    }

    return this.mapToResponseDto(question);
  }

  async update(
    setId: string,
    questionId: string,
    dto: UpdateQuestionDto,
    userId: string,
  ): Promise<QuestionResponseDto> {
    // Verify user owns the set
    const set = await this.questionSetRepository.findById(setId);
    if (!set) {
      throw new NotFoundException('Bộ đề không tồn tại');
    }
    if (set.ownerId !== userId) {
      throw new ForbiddenException('Không có quyền sửa câu hỏi');
    }

    // Verify question belongs to set
    const belongs = await this.questionRepository.belongsToSet(questionId, setId);
    if (!belongs) {
      throw new NotFoundException('Câu hỏi không thuộc bộ đề này');
    }

    // If changing topic, verify it belongs to the set
    if (dto.topicId) {
      const topicBelongs = await this.questionRepository.topicBelongsToSet(dto.topicId, setId);
      if (!topicBelongs) {
        throw new BadRequestException('Topic không thuộc bộ đề này');
      }
    }

    // Validate choices if provided
    if (dto.choices) {
      this.validateChoices(dto.choices);
    }

    const updateData: any = {};
    if (dto.content !== undefined) updateData.content = dto.content;
    if (dto.contentVi !== undefined) updateData.contentVi = dto.contentVi;
    if (dto.difficulty !== undefined) updateData.difficulty = dto.difficulty;
    if (dto.topicId !== undefined) updateData.topicId = dto.topicId;
    if (dto.choices !== undefined) updateData.choices = dto.choices;

    const question = await this.questionRepository.update(questionId, updateData);
    return this.mapToResponseDto(question);
  }

  async remove(setId: string, questionId: string, userId: string): Promise<void> {
    // Verify user owns the set
    const set = await this.questionSetRepository.findById(setId);
    if (!set) {
      throw new NotFoundException('Bộ đề không tồn tại');
    }
    if (set.ownerId !== userId) {
      throw new ForbiddenException('Không có quyền xóa câu hỏi');
    }

    // Verify question belongs to set
    const belongs = await this.questionRepository.belongsToSet(questionId, setId);
    if (!belongs) {
      throw new NotFoundException('Câu hỏi không thuộc bộ đề này');
    }

    await this.questionRepository.delete(questionId);
  }

  async updateExplanation(
    setId: string,
    questionId: string,
    dto: UpdateExplanationDto,
    userId: string,
  ): Promise<QuestionResponseDto> {
    // Verify user owns the set
    const set = await this.questionSetRepository.findById(setId);
    if (!set) {
      throw new NotFoundException('Bộ đề không tồn tại');
    }
    if (set.ownerId !== userId) {
      throw new ForbiddenException('Không có quyền sửa giải thích');
    }

    // Verify question belongs to set
    const question = await this.questionRepository.findById(questionId);
    if (!question || question.questionSetId !== setId) {
      throw new NotFoundException('Câu hỏi không tồn tại');
    }

    let newExplanation: any = question.explanation || {};

    if (dto.regenerate) {
      // Re-generate explanation using AI
      if (!question.content) {
        throw new BadRequestException('Không thể tạo giải thích cho câu hỏi không có nội dung');
      }

      // Find correct answer
      const choices = (question.choices as any[]) || [];
      const correctChoice = choices.find((c: any) => c.isCorrect);
      if (!correctChoice) {
        throw new BadRequestException('Câu hỏi không có đáp án đúng');
      }

      const explanation = await this.aiService.generateExplanation(
        question.content,
        correctChoice.content,
      );

      newExplanation = {
        ...(typeof newExplanation === 'object' ? newExplanation : {}),
        content: explanation,
        source: 'ai',
        isVerified: false,
      };
    } else if (dto.content) {
      // User manually edited
      newExplanation = {
        ...(typeof newExplanation === 'object' ? newExplanation : {}),
        content: dto.content,
        source: 'manual',
        isVerified: true,
      };
    }

    const updated = await this.questionRepository.update(questionId, {
      explanation: newExplanation as any,
    });

    return this.mapToResponseDto(updated);
  }

  async reportExplanation(
    setId: string,
    questionId: string,
    dto: ReportExplanationDto,
    userId: string,
  ): Promise<{ message: string }> {
    // Verify question belongs to set
    const question = await this.questionRepository.findById(questionId);
    if (!question || question.questionSetId !== setId) {
      throw new NotFoundException('Câu hỏi không tồn tại');
    }

    // Check if already reported by this user
    let feedback = await this.feedbackRepository.findByQuestionAndUser(questionId, userId);

    if (feedback) {
      // Update existing report
      await this.feedbackRepository.update(questionId, userId, dto.reason);
    } else {
      // Create new report
      await this.feedbackRepository.create(questionId, userId, dto.reason);
    }

    return { message: 'Report submitted' };
  }

  private validateChoices(choices: ChoiceDto[]): void {
    if (choices.length === 0) {
      throw new BadRequestException('Phải có ít nhất 1 đáp án');
    }

    const hasCorrect = choices.some((c) => c.isCorrect === true);
    if (!hasCorrect) {
      throw new BadRequestException('Phải có ít nhất 1 đáp án đúng');
    }
  }

  private mapToResponseDto(question: any): QuestionResponseDto {
    return {
      id: question.id,
      content: question.content,
      contentVi: question.contentVi,
      imageUrl: question.imageUrl,
      choices: question.choices,
      explanation: question.explanation,
      difficulty: question.difficulty,
      status: question.status,
      confidenceScore: question.confidenceScore,
      needsReview: question.needsReview,
      topicId: question.topicId,
      createdAt: question.createdAt,
      updatedAt: question.updatedAt,
    };
  }
}
