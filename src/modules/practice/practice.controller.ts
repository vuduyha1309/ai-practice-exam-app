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

  // ============ SPECIFIC POST ROUTES (must come first) ============

  @Post()
  async startSession(
    @Body() dto: StartSessionDto,
    @CurrentUser() user: { id: string },
  ) {
    this.validateUUID(dto.questionSetId);
    return this.practiceService.startSession(user.id, dto);
  }

  /**
   * POST /practice-sessions/quick
   * Start Quick Mode: 12 random questions for fast practice (~10-15 min)
   */
  @Post('quick')
  async startQuickMode(
    @Body() dto: { questionSetId: string },
    @CurrentUser() user: { id: string },
  ) {
    this.validateUUID(dto.questionSetId);
    return this.practiceService.startQuickMode(user.id, dto.questionSetId);
  }

  /**
   * POST /practice-sessions/deep
   * Start Deep Mode: 40 questions with in-depth learning (~30-45 min)
   */
  @Post('deep')
  async startDeepMode(
    @Body() dto: { questionSetId: string },
    @CurrentUser() user: { id: string },
  ) {
    this.validateUUID(dto.questionSetId);
    return this.practiceService.startDeepMode(user.id, dto.questionSetId);
  }

  /**
   * POST /practice-sessions/exam
   * Start Exam Mode: 75 questions for full exam simulation (~60-90 min with timer)
   */
  @Post('exam')
  async startExamMode(
    @Body() dto: { questionSetId: string },
    @CurrentUser() user: { id: string },
  ) {
    this.validateUUID(dto.questionSetId);
    return this.practiceService.startExamMode(user.id, dto.questionSetId);
  }

  /**
   * POST /practice-sessions/weakness
   * Start Weakness Mode: Focus on top 5 weak topics (20 questions, requires practice history)
   */
  @Post('weakness')
  async startWeaknessMode(
    @Body() dto: { questionSetId: string },
    @CurrentUser() user: { id: string },
  ) {
    this.validateUUID(dto.questionSetId);
    return this.practiceService.startWeaknessMode(user.id, dto.questionSetId, 20);
  }

  /**
   * POST /practice-sessions/most-mistaken
   * Start Most-Mistaken Mode: Focus on top frequently wrong questions (20 questions, requires mistake history)
   */
  @Post('most-mistaken')
  async startMostMistakenMode(
    @Body() dto: { questionSetId: string },
    @CurrentUser() user: { id: string },
  ) {
    this.validateUUID(dto.questionSetId);
    return this.practiceService.startMostMistakenMode(user.id, dto.questionSetId, 20);
  }

  /**
   * POST /practice-sessions/difficulty
   * Start Difficulty Mode: Focus on specific difficulty level (20 questions)
   */
  @Post('difficulty')
  async startDifficultyMode(
    @Body() dto: { questionSetId: string; difficulty: 'easy' | 'medium' | 'hard' },
    @CurrentUser() user: { id: string },
  ) {
    this.validateUUID(dto.questionSetId);
    return this.practiceService.startDifficultyMode(user.id, dto.questionSetId, dto.difficulty, 20);
  }

  /**
   * POST /practice-sessions/topic
   * Start Topic Mode: Focus on specific topic (20 questions, user must provide topicId)
   */
  @Post('topic')
  async startTopicMode(
    @Body() dto: { questionSetId: string; topicId: string },
    @CurrentUser() user: { id: string },
  ) {
    this.validateUUID(dto.questionSetId);
    this.validateUUID(dto.topicId);
    return this.practiceService.startTopicMode(user.id, dto.questionSetId, dto.topicId, 20);
  }

  /**
   * POST /practice-sessions/mixed
   * Start Mixed Mode: AI combines weak areas + most mistaken + by difficulty (30-40 questions)
   */
  @Post('mixed')
  async startMixedMode(
    @Body() dto: { questionSetId: string; questionCount?: number },
    @CurrentUser() user: { id: string },
  ) {
    this.validateUUID(dto.questionSetId);
    return this.practiceService.startMixedMode(user.id, dto.questionSetId, {
      questionCount: dto.questionCount || 30,
      includeWeakAreas: true,
      includeMostMistaken: true,
      includeEasy: true,
      includeMedium: true,
      includeHard: true,
    });
  }

  // ============ SPECIFIC GET ROUTES (must come before :id) ============

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

  // ============ GENERIC PARAMETER ROUTES (must come last) ============

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
}
