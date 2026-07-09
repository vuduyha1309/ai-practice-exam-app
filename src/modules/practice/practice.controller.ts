import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  BadRequestException,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { PracticeService } from './services/practice.service';
import { StartSessionDto } from './dto/start-session.dto';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('practice-sessions')
@UseGuards(JwtAuthGuard)
export class PracticeController {
  constructor(private practiceService: PracticeService) {}

  private validateUUID(id: string): void {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw new BadRequestException('ID không hợp lệ');
    }
  }

  @Post()
  async startSession(
    @Body() dto: StartSessionDto,
    @CurrentUser() user: { id: string },
  ) {
    this.validateUUID(dto.questionSetId);
    return this.practiceService.startSession(user.id, dto);
  }

  @Get()
  async getUserSessions(
    @CurrentUser() user: { id: string },
    @Query('page', new DefaultValuePipe(1), new ParseIntPipe()) page: number,
    @Query('limit', new DefaultValuePipe(20), new ParseIntPipe()) limit: number,
  ) {
    if (page < 1) throw new BadRequestException('Page phải >= 1');
    if (limit < 1 || limit > 100) throw new BadRequestException('Limit phải từ 1 đến 100');

    return this.practiceService.getUserSessions(user.id, page, limit);
  }

  @Get(':id')
  async getSession(
    @Param('id') sessionId: string,
    @CurrentUser() user: { id: string },
  ) {
    this.validateUUID(sessionId);
    return this.practiceService.getSession(sessionId, user.id);
  }

  @Get(':id/review')
  async getSessionReview(
    @Param('id') sessionId: string,
    @CurrentUser() user: { id: string },
  ) {
    this.validateUUID(sessionId);
    return this.practiceService.getSessionReview(sessionId, user.id);
  }

  @Patch(':id/answer')
  async submitAnswer(
    @Param('id') sessionId: string,
    @Body() dto: SubmitAnswerDto,
    @CurrentUser() user: { id: string },
  ) {
    this.validateUUID(sessionId);
    this.validateUUID(dto.questionId);

    return this.practiceService.submitAnswer(sessionId, dto, user.id);
  }

  @Post(':id/end')
  async endSession(
    @Param('id') sessionId: string,
    @CurrentUser() user: { id: string },
  ) {
    this.validateUUID(sessionId);
    return this.practiceService.endSession(sessionId, user.id);
  }

  /**
   * GET /practice-sessions/available-questions/:setId
   * Get available questions for practice (with filters)
   */
  @Get('available-questions/:setId')
  async getAvailableQuestions(
    @Param('setId') setId: string,
    @Query('difficulty') difficulty?: string,
    @Query('topicId') topicId?: string,
    @Query('limit', new DefaultValuePipe(50), new ParseIntPipe()) limit: number = 50,
  ) {
    this.validateUUID(setId);
    if (topicId) this.validateUUID(topicId);
    if (limit < 1 || limit > 100) throw new BadRequestException('Limit phải từ 1 đến 100');

    return this.practiceService.getAvailableQuestions(setId, {
      difficulty,
      topicId,
      limit,
    });
  }

  /**
   * POST /practice-sessions/weakness
   * Start weakness mode session (focuses on weak topics)
   */
  @Post('weakness-mode')
  async startWeaknessMode(
    @Body() dto: { questionSetId: string; questionCount?: number },
    @CurrentUser() user: { id: string },
  ) {
    this.validateUUID(dto.questionSetId);
    return this.practiceService.startWeaknessMode(user.id, dto.questionSetId, dto.questionCount || 20);
  }

  /**
   * POST /practice-sessions/most-mistaken
   * Start most-mistaken mode session (focuses on frequently wrong questions)
   */
  @Post('most-mistaken-mode')
  async startMostMistakenMode(
    @Body() dto: { questionSetId: string; questionCount?: number },
    @CurrentUser() user: { id: string },
  ) {
    this.validateUUID(dto.questionSetId);
    return this.practiceService.startMostMistakenMode(user.id, dto.questionSetId, dto.questionCount || 20);
  }

  /**
   * POST /practice-sessions/difficulty-mode
   * Start difficulty-focused session
   */
  @Post('difficulty-mode')
  async startDifficultyMode(
    @Body() dto: { questionSetId: string; difficulty: 'easy' | 'medium' | 'hard'; questionCount?: number },
    @CurrentUser() user: { id: string },
  ) {
    this.validateUUID(dto.questionSetId);
    return this.practiceService.startDifficultyMode(
      user.id,
      dto.questionSetId,
      dto.difficulty,
      dto.questionCount || 20,
    );
  }

  /**
   * POST /practice-sessions/topic-mode
   * Start topic-focused session
   */
  @Post('topic-mode')
  async startTopicMode(
    @Body() dto: { questionSetId: string; topicId: string; questionCount?: number },
    @CurrentUser() user: { id: string },
  ) {
    this.validateUUID(dto.questionSetId);
    this.validateUUID(dto.topicId);
    return this.practiceService.startTopicMode(user.id, dto.questionSetId, dto.topicId, dto.questionCount || 20);
  }

  /**
   * POST /practice-sessions/mixed-mode
   * Start mixed session combining weak areas, most mistaken, and by difficulty
   */
  @Post('mixed-mode')
  async startMixedMode(
    @Body() dto: {
      questionSetId: string;
      questionCount?: number;
      includeWeakAreas?: boolean;
      includeMostMistaken?: boolean;
      includeEasy?: boolean;
      includeMedium?: boolean;
      includeHard?: boolean;
    },
    @CurrentUser() user: { id: string },
  ) {
    this.validateUUID(dto.questionSetId);
    return this.practiceService.startMixedMode(user.id, dto.questionSetId, {
      questionCount: dto.questionCount || 30,
      includeWeakAreas: dto.includeWeakAreas !== false,
      includeMostMistaken: dto.includeMostMistaken !== false,
      includeEasy: dto.includeEasy !== false,
      includeMedium: dto.includeMedium !== false,
      includeHard: dto.includeHard !== false,
    });
  }
}
