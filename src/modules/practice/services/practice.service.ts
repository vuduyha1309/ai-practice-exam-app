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

    const mode = dto.mode || PracticeMode.quick;
    let questions: any[] = [];

    // Determine question selection based on mode
    switch (mode) {
      case 'quick':
        // Quick mode: 10-15 random questions (fixed: 12)
        const allQuestions = await this.practiceRepository.getQuestionsBySet(dto.questionSetId, 100);
        // Shuffle and take 12
        questions = allQuestions
          .sort(() => Math.random() - 0.5)
          .slice(0, Math.min(12, allQuestions.length));
        break;

      case 'deep':
        // Deep mode: 30-45 questions (fixed: 40, covering all topics)
        const deepQuestions = await this.practiceRepository.getQuestionsBySet(dto.questionSetId, 100);
        questions = deepQuestions
          .sort(() => Math.random() - 0.5)
          .slice(0, Math.min(40, deepQuestions.length));
        break;

      case 'exam':
        // Exam mode: 60-90 questions (full exam simulation)
        questions = await this.practiceRepository.getQuestionsBySet(dto.questionSetId, 100);
        // Return up to 75 questions
        questions = questions.slice(0, Math.min(75, questions.length));
        break;

      case 'weakness':
        // Weakness mode: Focus on weak topics (requires user history)
        try {
          const weakTopics = await this.practiceRepository.getWeakTopics(userId, 5);
          if (weakTopics.length === 0) {
            throw new BadRequestException('Không có dữ liệu để luyện tập các phần yếu. Vui lòng luyện tập trước.');
          }
          const topicIds = weakTopics.map((t) => t.topicId);
          questions = await this.practiceRepository.getQuestionsByTopics(dto.questionSetId, topicIds, 20);
        } catch (error) {
          if (error instanceof BadRequestException) throw error;
          throw new BadRequestException('Không thể tạo weakness mode');
        }
        break;

      default:
        // Fallback: Quick mode
        const fallbackQuestions = await this.practiceRepository.getQuestionsBySet(dto.questionSetId, 100);
        questions = fallbackQuestions
          .sort(() => Math.random() - 0.5)
          .slice(0, Math.min(12, fallbackQuestions.length));
    }

    if (questions.length === 0) {
      throw new BadRequestException('Bộ đề không có câu hỏi nào');
    }

    // Create practice session
    const session = await this.practiceRepository.createSession({
      user: { connect: { id: userId } },
      questionSet: { connect: { id: dto.questionSetId } },
      mode,
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

    // Get topic info if available
    let topicName = '';
    if (session.topicId) {
      const topic = await this.practiceRepository.getTopicById(session.topicId);
      if (topic) {
        topicName = topic.name;
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

    // accuracy = correct/answered * 100 (đã là phần trăm)
    const accuracy = session.answered > 0 ? (session.correct / session.answered) * 100 : 0;

    return {
      id: session.id,
      userId: session.userId,
      questionSetId: session.questionSetId,
      questionSetTitle,
      topicId: session.topicId,
      topicName,
      mode: session.mode,
      totalQuestions: session.totalQuestions,
      answered: session.answered,
      correct: session.correct,
      accuracy: Math.round(accuracy * 100) / 100,  // Làm tròn 2 chữ số thập phân
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
        markedForReview: dto.markedForReview,
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
        markedForReview: dto.markedForReview,
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
    // accuracy = correct/answered * 100 (đã là phần trăm)
    const accuracy = session.answered > 0 ? (session.correct / session.answered) * 100 : 0;

    return {
      id: session.id,
      userId: session.userId,
      questionSetId: session.questionSetId,
      questionSetTitle: session.questionSet?.title || 'Unknown Set',
      topicId: session.topicId,
      mode: session.mode,
      totalQuestions: session.totalQuestions,
      answered: session.answered,
      correct: session.correct,
      accuracy: Math.round(accuracy * 100) / 100,  // Làm tròn 2 chữ số thập phân
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

  async startQuickMode(userId: string, setId: string): Promise<SessionResponseDto> {
    const set = await this.questionSetRepository.findById(setId);
    if (!set) {
      throw new NotFoundException('Bộ đề không tồn tại');
    }

    // Get 12 random questions
    const allQuestions = await this.practiceRepository.getQuestionsBySet(setId, 100);
    const questions = allQuestions
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(12, allQuestions.length));

    if (questions.length === 0) {
      throw new BadRequestException('Bộ đề không có câu hỏi nào');
    }

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

  async startDeepMode(userId: string, setId: string): Promise<SessionResponseDto> {
    const set = await this.questionSetRepository.findById(setId);
    if (!set) {
      throw new NotFoundException('Bộ đề không tồn tại');
    }

    // Get 40 random questions
    const allQuestions = await this.practiceRepository.getQuestionsBySet(setId, 100);
    const questions = allQuestions
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(40, allQuestions.length));

    if (questions.length === 0) {
      throw new BadRequestException('Bộ đề không có câu hỏi nào');
    }

    const session = await this.practiceRepository.createSession({
      user: { connect: { id: userId } },
      questionSet: { connect: { id: setId } },
      mode: 'deep',
      totalQuestions: questions.length,
      status: SessionStatus.in_progress,
      startedAt: new Date(),
    });

    return this.mapToResponseDto(session);
  }

  async startExamMode(userId: string, setId: string): Promise<SessionResponseDto> {
    const set = await this.questionSetRepository.findById(setId);
    if (!set) {
      throw new NotFoundException('Bộ đề không tồn tại');
    }

    // Get 75 questions for exam
    const allQuestions = await this.practiceRepository.getQuestionsBySet(setId, 100);
    const questions = allQuestions.slice(0, Math.min(75, allQuestions.length));

    if (questions.length === 0) {
      throw new BadRequestException('Bộ đề không có câu hỏi nào');
    }

    const session = await this.practiceRepository.createSession({
      user: { connect: { id: userId } },
      questionSet: { connect: { id: setId } },
      mode: 'exam',
      totalQuestions: questions.length,
      status: SessionStatus.in_progress,
      startedAt: new Date(),
    });

    return this.mapToResponseDto(session);
  }

  async startWeaknessMode(userId: string, setId: string, questionCount: number): Promise<SessionResponseDto> {
    // Get user's weak topics (lowest accuracy) - TOP 5
    const weakTopics = await this.practiceRepository.getWeakTopics(userId, 5);

    // Must have weak topics (requires practice history)
    if (weakTopics.length === 0) {
      throw new BadRequestException(
        'Không đủ dữ liệu để luyện tập chế độ Weakness. Vui lòng hoàn thành ít nhất một phiên luyện tập chuẩn (Quick/Deep/Exam) trước.'
      );
    }

    // Get questions from weak topics
    const topicIds = weakTopics.map((t) => t.topicId);
    const questions = await this.practiceRepository.getQuestionsByTopics(setId, topicIds, questionCount);

    if (questions.length === 0) {
      throw new BadRequestException('Không có câu hỏi trong các phần yếu của bộ đề này');
    }

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

    // Must have mistaken questions (requires practice history with mistakes)
    if (questions.length === 0) {
      throw new BadRequestException(
        'Không đủ dữ liệu để luyện tập chế độ Most-Mistaken. Bạn cần trả lời sai ít nhất vài câu trong các phiên luyện tập trước.'
      );
    }

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

    const session = await this.practiceRepository.createSession({
      user: { connect: { id: userId } },
      questionSet: { connect: { id: setId } },
      topic: { connect: { id: topicId } },
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
    let primaryTopicId: string | undefined;

    // Get weak areas questions
    if (options.includeWeakAreas) {
      try {
        const weakTopics = await this.practiceRepository.getWeakTopics(userId, 3);
        if (weakTopics.length > 0) {
          // Track primary weak topic
          primaryTopicId = weakTopics[0].topicId;
          const topicIds = weakTopics.map((t) => t.topicId);
          const weakQuestions = await this.practiceRepository.getQuestionsByTopics(
            setId,
            topicIds,
            Math.ceil(options.questionCount * 0.3),
          );
          weakQuestions.forEach((q) => questionIds.add(q.id));
        }
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
        if (mistakenQuestions.length > 0) {
          mistakenQuestions.forEach((q) => questionIds.add(q.questionId));
        }
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

    // Must have enough questions from smart selection
    if (questionIds.size === 0) {
      throw new BadRequestException(
        'Không đủ dữ liệu để luyện tập chế độ Mixed. Bạn cần hoàn thành ít nhất một phiên luyện tập chuẩn (Quick/Deep/Exam) trước.'
      );
    }

    // Limit to requested question count
    const finalQuestionIds = Array.from(questionIds).slice(0, options.questionCount);

    const sessionData: any = {
      user: { connect: { id: userId } },
      questionSet: { connect: { id: setId } },
      mode: 'deep',
      totalQuestions: finalQuestionIds.length,
      status: SessionStatus.in_progress,
      startedAt: new Date(),
    };

    // Track primary topic if available (from weak areas)
    if (primaryTopicId) {
      sessionData.topic = { connect: { id: primaryTopicId } };
    }

    const session = await this.practiceRepository.createSession(sessionData);

    return this.mapToResponseDto(session);
  }
}
