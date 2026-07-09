import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { TopicsService } from './services/topics.service';
import { CreateTopicDto } from './dto/create-topic.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';
import { ConfirmTopicDto } from './dto/confirm-topic.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@Controller('question-sets/:setId/topics')
@UseGuards(JwtAuthGuard)
export class TopicsController {
  constructor(private topicsService: TopicsService) {}

  private validateUUID(id: string): void {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw new BadRequestException('ID không hợp lệ');
    }
  }

  @Post()
  create(
    @Param('setId') setId: string,
    @Body() createTopicDto: CreateTopicDto,
    @CurrentUser() user: { id: string },
  ) {
    this.validateUUID(setId);
    return this.topicsService.create(setId, createTopicDto, user.id);
  }

  @Get()
  findAll(@Param('setId') setId: string, @CurrentUser() user: { id: string }) {
    this.validateUUID(setId);
    return this.topicsService.findAll(setId, user.id);
  }

  @Patch(':id')
  update(
    @Param('setId') setId: string,
    @Param('id') topicId: string,
    @Body() updateTopicDto: UpdateTopicDto,
    @CurrentUser() user: { id: string },
  ) {
    this.validateUUID(setId);
    this.validateUUID(topicId);
    return this.topicsService.update(setId, topicId, updateTopicDto, user.id);
  }

  @Patch(':id/confirm')
  confirm(
    @Param('setId') setId: string,
    @Param('id') topicId: string,
    @Body() confirmTopicDto: ConfirmTopicDto,
    @CurrentUser() user: { id: string },
  ) {
    this.validateUUID(setId);
    this.validateUUID(topicId);
    return this.topicsService.confirm(setId, topicId, confirmTopicDto, user.id);
  }

  @Delete(':id')
  remove(
    @Param('setId') setId: string,
    @Param('id') topicId: string,
    @CurrentUser() user: { id: string },
  ) {
    this.validateUUID(setId);
    this.validateUUID(topicId);
    return this.topicsService.remove(setId, topicId, user.id);
  }
}
