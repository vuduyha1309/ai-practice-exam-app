import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PracticeRepository } from '../repositories/practice.repository';
import { QuestionSetRepository } from '../../question-sets/repositories/question-set.repository';
import { QuestionRepository } from '../../questions/repositories/question.repository';
import { StartSessionDto } from '../dto/start-session.dto';
import { SubmitAnswerDto } from '../dto/submit-answer.dto';
import { SessionResponseDto } from '../dto/session.response.dto';
import { SessionStatus, PracticeMode } from '@prisma/client';

@Injectable()
export class PracticeService {
  constructor(
    private practiceRepository: PracticeRepository,
    private questionSetRepository: QuestionSetRepository,
    private questionRepository: QuestionRepository,
  ) {}

  async startSession(userId: string, dto: StartSessionDto): Promise<SessionResponseDto> {
    // Verify question set exists
    const set = await this.questionSetRepository.findById(dto.questionSetId);
    if (!set) {
      throw new NotFoundException('Bộ đề không tồn tại');
    }

    // Get all active questions in set
    const questions = await this.practiceRepository.getQuestionsBySet(dto.questionSetId);

    if (questions.length === 0) {
      throw new BadRequestException('Bộ đề không có câu hỏi nào');
    }

    // Create practice session
    const session = await this.practiceRepository.createSession({
      user: { connect: { id: userId } },
      questionSet: { connect: { id: dto.questionSetId } },
      mode: dto.mode || PracticeMode.quick,
      totalQuestions: questions.length,
      status: SessionStatus.in_progress,
      startedAt: new Date(),
    });

    return this.mapToResponseDto(session);
  }

  async getSession(sessionId: string, userId: string): Promise<SessionResponseDto> {
    const session = await this.practiceRepository.findSessionById(sessionId);

    if (!session) {
      throw new NotFoundException('Session không tồn tại');
    }

    if (session.userId !== userId) {
      throw new ForbiddenException('Không có quyền xem session này');
    }

    return this.mapToResponseDto(session);
  }

  async getSessionReview(sessionId: string, userId: string): Promise<any> {
    const session = await this.practiceRepository.findSessionById(sessionId);

    if (!session) {
      throw new NotFoundException('Session không tồn tại');
    }

    if (session.userId !== userId) {
      throw new ForbiddenException('Không có quyền xem session này');
    }

    // Get question set info
    let questionSetTitle = '';
    if (session.questionSetId) {
      const set = await this.questionSetRepository.findById(session.questionSetId);
      if (set) {
        questionSetTitle = set.title;
      }
    }

    // Enrich answers with full question details
    const answersWithDetails = await Promise.all(
      (session.answers || []).map(async (answer: any) => {
        const question = await this.questionRepository.findById(answer.questionId);
        if (!question) return null;

        const choices = (question.choices as any[]) || [];
        const correctChoices = choices.filter((c) => c.isCorrect);
        const correctKeys = correctChoices.map((c) => c.key);

        // Parse selected keys (JSON string -> array)
        let selectedKeys: string[] = [];
        try {
          if (answer.selectedChoiceKeys) {
            selectedKeys = JSON.parse(answer.selectedChoiceKeys);
          }
        } catch {
          // Fallback for old single choice format
          selectedKeys = answer.selectedChoiceKeys ? [answer.selectedChoiceKeys] : [];
        }

        return {
          id: answer.id,
          questionId: answer.questionId,
          content: question.content,
          contentVi: question.contentVi,
          questionType: question.questionType,
          choices: choices.map((c) => ({
            key: c.key,
            content: c.content,
            contentVi: c.contentVi,
            isCorrect: c.isCorrect,
          })),
          explanation: question.explanation,
          difficulty: question.difficulty,
          topic: question.topicId ? { id: question.topicId, name: 'Topic Name' } : undefined,
          selectedKeys,
          correctKeys,
          isCorrect: answer.isCorrect,
          timeSpentMs: answer.timeSpentMs,
          aiExplanationViewed: answer.aiExplanationViewed,
          seqOrder: answer.seqOrder,
        };
      }),
    );

    const accuracy = session.answered > 0 ? (session.correct / session.answered) * 100 : 0;

    return {
      id: session.id,
      userId: session.userId,
      questionSetId: session.questionSetId,
      questionSetTitle,
      mode: session.mode,
      totalQuestions: session.totalQuestions,
      answered: session.answered,
      correct: session.correct,
      accuracy: Math.round(accuracy * 100) / 100,
      durationSeconds: session.durationSeconds,
      status: session.status,
      startedAt: session.startedAt,
      endedAt: session.endedAt,
      answers: answersWithDetails.filter((a) => a !== null),
    };
  }

  async submitAnswer(
    sessionId: string,
    dto: SubmitAnswerDto,
    userId: string,
  ): Promise<SessionResponseDto> {
    // Verify session
    const session = await this.practiceRepository.findSessionById(sessionId);
    if (!session) {
      throw new NotFoundException('Session không tồn tại');
    }

    if (session.userId !== userId) {
      throw new ForbiddenException('Không có quyền trả lời trong session này');
    }

    if (session.status !== SessionStatus.in_progress) {
      throw new BadRequestException('Session đã kết thúc');
    }

    // Verify question exists and belongs to set
    const question = await this.questionRepository.findById(dto.questionId);
    if (!question || question.questionSetId !== session.questionSetId) {
      throw new NotFoundException('Câu hỏi không tồn tại hoặc không thuộc bộ đề');
    }

    // Get correct choices based on question type
    const choices = (question.choices as any[]) || [];
    const correctChoices = choices.filter((c) => c.isCorrect);
    if (correctChoices.length === 0) {
      throw new BadRequestException('Câu hỏi không có đáp án đúng');
    }

    // Normalize selected keys to array
    let selectedKeys: string[] = [];
    if (typeof dto.selectedChoiceKeys === 'string') {
      selectedKeys = dto.selectedChoiceKeys ? [dto.selectedChoiceKeys] : [];
    } else if (Array.isArray(dto.selectedChoiceKeys)) {
      selectedKeys = dto.selectedChoiceKeys;
    }

    // Check if answer is correct
    const correctKeys = correctChoices.map((c) => c.key).sort();
    const selectedKeysSorted = selectedKeys.sort();
    const isCorrect = JSON.stringify(correctKeys) === JSON.stringify(selectedKeysSorted);

    // Store selected keys as JSON string
    const selectedKeysJson = JSON.stringify(selectedKeys);

    // Check if already answered
    let answer = await this.practiceRepository.findAnswerInSession(sessionId, dto.questionId);

    if (answer) {
      // Update existing answer
      await this.practiceRepository.updateAnswer(sessionId, dto.questionId, {
        selectedChoiceKeys: selectedKeysJson as any,
        isCorrect,
        timeSpentMs: dto.timeSpentMs,
        aiExplanationViewed: dto.aiExplanationViewed,
      });
    } else {
      // Create new answer
      const seqOrder = session.answers?.length || 0;
      await this.practiceRepository.createAnswer({
        session: { connect: { id: sessionId } },
        question: { connect: { id: dto.questionId } },
        selectedChoiceKeys: selectedKeysJson as any,
        isCorrect,
        timeSpentMs: dto.timeSpentMs,
        aiExplanationViewed: dto.aiExplanationViewed,
        seqOrder,
      });
    }

    // Update session stats
    const answeredCount = (session.answers?.length || 0) + 1;
    const correctCount = session.answers?.filter((a) => a.isCorrect).length || 0;
    const newCorrectCount = correctCount + (isCorrect ? 1 : 0);

    // Update user stats
    if (question.topicId) {
      await this.practiceRepository.updateUserTopicStat(userId, question.topicId, isCorrect);
    }
    await this.practiceRepository.updateUserQuestionStat(userId, dto.questionId, isCorrect);

    // Update session
    const updatedSession = await this.practiceRepository.updateSession(sessionId, {
      answered: answeredCount,
      correct: newCorrectCount,
    });

    return this.mapToResponseDto(updatedSession);
  }

  async endSession(sessionId: string, userId: string): Promise<SessionResponseDto> {
    // Verify session
    const session = await this.practiceRepository.findSessionById(sessionId);
    if (!session) {
      throw new NotFoundException('Session không tồn tại');
    }

    if (session.userId !== userId) {
      throw new ForbiddenException('Không có quyền kết thúc session này');
    }

    if (session.status !== SessionStatus.in_progress) {
      throw new BadRequestException('Session đã kết thúc rồi');
    }

    // Calculate duration
    const endedAt = new Date();
    const durationSeconds = Math.floor(
      (endedAt.getTime() - session.startedAt.getTime()) / 1000,
    );

    // Update streak log
    if (session.answered > 0) {
      await this.practiceRepository.recordStreakLog(userId, session.answered);
    }

    // End session
    const updatedSession = await this.practiceRepository.updateSession(sessionId, {
      status: SessionStatus.completed,
      durationSeconds,
      endedAt,
    });

    return this.mapToResponseDto(updatedSession);
  }

  async getUserSessions(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ data: SessionResponseDto[]; meta: { total: number; page: number; limit: number } }> {
    const { sessions, total } = await this.practiceRepository.getUserSessions(userId, page, limit);

    return {
      data: sessions.map((s) => this.mapToResponseDto(s)),
      meta: { total, page, limit },
    };
  }

  private mapToResponseDto(session: any): SessionResponseDto {
    const accuracy = session.answered > 0 ? (session.correct / session.answered) * 100 : 0;

    return {
      id: session.id,
      userId: session.userId,
      questionSetId: session.questionSetId,
      mode: session.mode,
      totalQuestions: session.totalQuestions,
      answered: session.answered,
      correct: session.correct,
      accuracy: Math.round(accuracy * 100) / 100,
      durationSeconds: session.durationSeconds,
      status: session.status,
      startedAt: session.startedAt,
      endedAt: session.endedAt,
      answers: session.answers?.map((a: any) => ({
        id: a.id,
        questionId: a.questionId,
        selectedChoiceKey: a.selectedChoiceKey,
        isCorrect: a.isCorrect,
        timeSpentMs: a.timeSpentMs,
        aiExplanationViewed: a.aiExplanationViewed,
        seqOrder: a.seqOrder,
      })),
    };
  }

  async getAvailableQuestions(
    setId: string,
    filters: { difficulty?: string; topicId?: string; limit: number },
  ) {
    const where: any = {
      questionSetId: setId,
      status: 'active',
    };

    if (filters.difficulty) {
      where.difficulty = filters.difficulty.toUpperCase();
    }

    if (filters.topicId) {
      where.topicId = filters.topicId;
    }

    const questions = await this.questionRepository.findMany({
      where,
      take: filters.limit,
      orderBy: { sortOrder: 'asc' },
    });

    return {
      data: questions,
      count: questions.length,
    };
  }

  async startWeaknessMode(userId: string, setId: string, questionCount: number): Promise<SessionResponseDto> {
    // Get user's weak topics (lowest accuracy)
    const weakTopics = await this.practiceRepository.getWeakTopics(userId, 5);

    if (weakTopics.length === 0) {
      throw new BadRequestException('Không có dữ liệu để luyện tập các phần yếu. Vui lòng luyện tập trước.');
    }

    // Get questions from weak topics
    const topicIds = weakTopics.map((t) => t.topicId);
    const questions = await this.practiceRepository.getQuestionsByTopics(setId, topicIds, questionCount);

    if (questions.length === 0) {
      throw new BadRequestException('Không có câu hỏi trong các phần yếu');
    }

    // Create session
    const session = await this.practiceRepository.createSession({
      user: { connect: { id: userId } },
      questionSet: { connect: { id: setId } },
      mode: 'weakness',
      totalQuestions: questions.length,
      status: SessionStatus.in_progress,
      startedAt: new Date(),
    });

    return this.mapToResponseDto(session);
  }

  async startMostMistakenMode(userId: string, setId: string, questionCount: number): Promise<SessionResponseDto> {
    // Get most mistaken questions
    const questions = await this.practiceRepository.getMostMistakenQuestions(userId, setId, questionCount);

    if (questions.length === 0) {
      throw new BadRequestException('Không có câu hỏi sai. Vui lòng luyện tập trước.');
    }

    // Create session
    const session = await this.practiceRepository.createSession({
      user: { connect: { id: userId } },
      questionSet: { connect: { id: setId } },
      mode: 'weakness',
      totalQuestions: questions.length,
      status: SessionStatus.in_progress,
      startedAt: new Date(),
    });

    return this.mapToResponseDto(session);
  }

  async startDifficultyMode(
    userId: string,
    setId: string,
    difficulty: 'easy' | 'medium' | 'hard',
    questionCount: number,
  ): Promise<SessionResponseDto> {
    const questions = await this.practiceRepository.getQuestionsByDifficulty(setId, difficulty, questionCount);

    if (questions.length === 0) {
      throw new BadRequestException(`Không có câu hỏi ${difficulty}`);
    }

    // Create session
    const session = await this.practiceRepository.createSession({
      user: { connect: { id: userId } },
      questionSet: { connect: { id: setId } },
      mode: 'quick',
      totalQuestions: questions.length,
      status: SessionStatus.in_progress,
      startedAt: new Date(),
    });

    return this.mapToResponseDto(session);
  }
  async startTopicMode(userId: string, setId: string, topicId: string, questionCount: number): Promise<SessionResponseDto> {
    const questions = await this.practiceRepository.getQuestionsByTopic(setId, topicId, questionCount);

    if (questions.length === 0) {
      throw new BadRequestException('Không có câu hỏi trong chủ đề này');
    }

    // Create session
    const session = await this.practiceRepository.createSession({
      user: { connect: { id: userId } },
      questionSet: { connect: { id: setId } },
      mode: 'quick',
      totalQuestions: questions.length,
      status: SessionStatus.in_progress,
      startedAt: new Date(),
    });

    return this.mapToResponseDto(session);
  }

  async startMixedMode(
    userId: string,
    setId: string,
    options: {
      questionCount: number;
      includeWeakAreas: boolean;
      includeMostMistaken: boolean;
      includeEasy: boolean;
      includeMedium: boolean;
      includeHard: boolean;
    },
  ): Promise<SessionResponseDto> {
    const questionIds = new Set<string>();

    // Get weak areas questions
    if (options.includeWeakAreas) {
      try {
        const weakTopics = await this.practiceRepository.getWeakTopics(userId, 3);
        const topicIds = weakTopics.map((t) => t.topicId);
        const weakQuestions = await this.practiceRepository.getQuestionsByTopics(
          setId,
          topicIds,
          Math.ceil(options.questionCount * 0.3),
        );
        weakQuestions.forEach((q) => questionIds.add(q.id));
      } catch {
        // Skip if no weak areas
      }
    }

    // Get most mistaken questions
    if (options.includeMostMistaken) {
      try {
        const mistakenQuestions = await this.practiceRepository.getMostMistakenQuestions(
          userId,
          setId,
          Math.ceil(options.questionCount * 0.3),
        );
        mistakenQuestions.forEach((q) => questionIds.add(q.questionId));
      } catch {
        // Skip if no mistaken questions
      }
    }

    // Get questions by difficulty
    if (options.includeEasy) {
      const easyQuestions = await this.practiceRepository.getQuestionsByDifficulty(
        setId,
        'easy',
        Math.ceil(options.questionCount * 0.15),
      );
      easyQuestions.forEach((q) => questionIds.add(q.id));
    }

    if (options.includeMedium) {
      const mediumQuestions = await this.practiceRepository.getQuestionsByDifficulty(
        setId,
        'medium',
        Math.ceil(options.questionCount * 0.15),
      );
      mediumQuestions.forEach((q) => questionIds.add(q.id));
    }

    if (options.includeHard) {
      const hardQuestions = await this.practiceRepository.getQuestionsByDifficulty(
        setId,
        'hard',
        Math.ceil(options.questionCount * 0.1),
      );
      hardQuestions.forEach((q) => questionIds.add(q.id));
    }

    if (questionIds.size === 0) {
      throw new BadRequestException('Không có câu hỏi phù hợp. Vui lòng luyện tập trước.');
    }

    // Limit to requested question count
    const finalQuestionIds = Array.from(questionIds).slice(0, options.questionCount);

    // Create session
    const session = await this.practiceRepository.createSession({
      user: { connect: { id: userId } },
      questionSet: { connect: { id: setId } },
      mode: 'deep',
      totalQuestions: finalQuestionIds.length,
      status: SessionStatus.in_progress,
      startedAt: new Date(),
    });

    return this.mapToResponseDto(session);
  }
}
