import { Controller, Get, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './services/analytics.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UserStatsResponseDto } from './dto/stats.response.dto';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  /**
   * GET /analytics/stats
   * Get comprehensive user statistics including overall stats, topics, weak/strength areas, streaks, etc.
   */
  @Get('stats')
  async getUserStats(@CurrentUser() user: any): Promise<UserStatsResponseDto> {
    return this.analyticsService.getUserStats(user.id);
  }

  /**
   * GET /analytics/overall
   * Get overall statistics (total sessions, questions answered, accuracy, time spent)
   */
  @Get('overall')
  async getOverallStats(@CurrentUser() user: any) {
    return this.analyticsService.getOverallStats(user.id);
  }

  /**
   * GET /analytics/topics
   * Get statistics by topic (accuracy, attempts, last practiced)
   */
  @Get('topics')
  async getTopicStats(@CurrentUser() user: any) {
    return this.analyticsService.getTopicStats(user.id);
  }

  /**
   * GET /analytics/weak-areas
   * Get top 5 weakest topics (lowest accuracy)
   */
  @Get('weak-areas')
  async getWeakAreas(@CurrentUser() user: any) {
    return this.analyticsService.getWeakAreas(user.id, 5);
  }

  /**
   * GET /analytics/strength-areas
   * Get top 5 strongest topics (highest accuracy)
   */
  @Get('strength-areas')
  async getStrengthAreas(@CurrentUser() user: any) {
    return this.analyticsService.getStrengthAreas(user.id, 5);
  }

  /**
   * GET /analytics/most-mistaken
   * Get most mistaken questions
   */
  @Get('most-mistaken')
  async getMostMistakenQuestions(@CurrentUser() user: any) {
    return this.analyticsService.getMostMistakenQuestions(user.id, 10);
  }

  /**
   * GET /analytics/streak
   * Get current streak, longest streak, and streak history (last 30 days)
   */
  @Get('streak')
  async getDailyStreak(@CurrentUser() user: any) {
    return this.analyticsService.getDailyStreak(user.id);
  }

  /**
   * GET /analytics/recent-sessions
   * Get last 5 completed practice sessions
   */
  @Get('recent-sessions')
  async getRecentSessions(@CurrentUser() user: any) {
    return this.analyticsService.getRecentSessions(user.id, 5);
  }

  /**
   * GET /analytics/difficulty
   * Get question distribution and accuracy by difficulty level
   */
  @Get('difficulty')
  async getDifficulty(@CurrentUser() user: any) {
    const [distribution, accuracyByDifficulty] = await Promise.all([
      this.analyticsService.getDifficultyDistribution(user.id),
      this.analyticsService.getAccuracyByDifficulty(user.id),
    ]);

    return {
      distribution,
      accuracyByDifficulty,
    };
  }

  /**
   * GET /analytics/session-modes
   * Get statistics by practice session mode (quick, deep, exam, weakness)
   */
  @Get('session-modes')
  async getSessionModeStats(@CurrentUser() user: any) {
    return this.analyticsService.getSessionModeStats(user.id);
  }
}
