import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  ParseIntPipe,
  BadRequestException,
  DefaultValuePipe,
} from '@nestjs/common';
import { QuestionSetsService } from './services/question-sets.service';
import { CreateQuestionSetDto } from './dto/create-question-set.dto';
import { UpdateQuestionSetDto } from './dto/update-question-set.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { VisibilityType } from '@prisma/client';

@Controller('question-sets')
@UseGuards(JwtAuthGuard)
export class QuestionSetsController {
  constructor(private questionSetsService: QuestionSetsService) {}

  @Post()
  create(@Body() createQuestionSetDto: CreateQuestionSetDto, @CurrentUser() user: { id: string }) {
    return this.questionSetsService.create(createQuestionSetDto, user.id);
  }

  @Get()
  findAll(
    @CurrentUser() user: { id: string },
    @Query('page', new DefaultValuePipe(1), new ParseIntPipe()) page: number,
    @Query('limit', new DefaultValuePipe(20), new ParseIntPipe()) limit: number,
    @Query('visibility') visibility?: string,
    @Query('search') search?: string,
  ) {
    // Validate page and limit
    if (page < 1) throw new BadRequestException('Page phải >= 1');
    if (limit < 1 || limit > 100) throw new BadRequestException('Limit phải từ 1 đến 100');

    const visibilityEnum = visibility ? (visibility as VisibilityType) : undefined;
    return this.questionSetsService.findAll(user.id, page, limit, visibilityEnum, search);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw new BadRequestException('ID không hợp lệ');
    }
    return this.questionSetsService.findOne(id, user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateQuestionSetDto: UpdateQuestionSetDto,
    @CurrentUser() user: { id: string },
  ) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw new BadRequestException('ID không hợp lệ');
    }
    return this.questionSetsService.update(id, updateQuestionSetDto, user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw new BadRequestException('ID không hợp lệ');
    }
    return this.questionSetsService.remove(id, user.id);
  }
}
