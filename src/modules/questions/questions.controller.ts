import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
  BadRequestException,
  DefaultValuePipe,
  UseGuards,
} from '@nestjs/common';
import { QuestionsService } from './services/questions.service';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { UpdateExplanationDto } from './dto/update-explanation.dto';
import { ReportExplanationDto } from './dto/report-explanation.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('question-sets/:setId/questions')
@UseGuards(JwtAuthGuard)
export class QuestionsController {
  constructor(private questionsService: QuestionsService) {}

  private validateUUID(id: string): void {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw new BadRequestException('ID không hợp lệ');
    }
  }

  @Get()
  findAll(
    @Param('setId') setId: string,
    @CurrentUser() user: { id: string },
    @Query('page', new DefaultValuePipe(1), new ParseIntPipe()) page: number,
    @Query('limit', new DefaultValuePipe(20), new ParseIntPipe()) limit: number,
    @Query('needsReview') needsReview?: string,
  ) {
    this.validateUUID(setId);

    if (page < 1) throw new BadRequestException('Page phải >= 1');
    if (limit < 1 || limit > 100) throw new BadRequestException('Limit phải từ 1 đến 100');

    const needsReviewBool = needsReview === 'true' ? true : needsReview === 'false' ? false : undefined;

    return this.questionsService.findAll(setId, user.id, page, limit, needsReviewBool);
  }

  @Get(':id')
  findOne(
    @Param('setId') setId: string,
    @Param('id') questionId: string,
    @CurrentUser() user: { id: string },
  ) {
    this.validateUUID(setId);
    this.validateUUID(questionId);
    return this.questionsService.findOne(setId, questionId, user.id);
  }

  @Patch(':id')
  update(
    @Param('setId') setId: string,
    @Param('id') questionId: string,
    @Body() updateQuestionDto: UpdateQuestionDto,
    @CurrentUser() user: { id: string },
  ) {
    this.validateUUID(setId);
    this.validateUUID(questionId);
    return this.questionsService.update(setId, questionId, updateQuestionDto, user.id);
  }

  @Delete(':id')
  remove(
    @Param('setId') setId: string,
    @Param('id') questionId: string,
    @CurrentUser() user: { id: string },
  ) {
    this.validateUUID(setId);
    this.validateUUID(questionId);
    return this.questionsService.remove(setId, questionId, user.id);
  }

  @Patch(':id/explanation')
  updateExplanation(
    @Param('setId') setId: string,
    @Param('id') questionId: string,
    @Body() updateExplanationDto: UpdateExplanationDto,
    @CurrentUser() user: { id: string },
  ) {
    this.validateUUID(setId);
    this.validateUUID(questionId);
    return this.questionsService.updateExplanation(setId, questionId, updateExplanationDto, user.id);
  }

  @Patch(':id/explanation/report')
  reportExplanation(
    @Param('setId') setId: string,
    @Param('id') questionId: string,
    @Body() reportExplanationDto: ReportExplanationDto,
    @CurrentUser() user: { id: string },
  ) {
    this.validateUUID(setId);
    this.validateUUID(questionId);
    return this.questionsService.reportExplanation(setId, questionId, reportExplanationDto, user.id);
  }
}
