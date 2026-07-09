import { Injectable } from '@nestjs/common';
import { AnalyticsRepository } from '../repositories/analytics.repository';

@Injectable()
export class AnalyticsService {
  constructor(private analyticsRepository: AnalyticsRepository) {}

  async getUserStats(userId: string) {
    const [overallStats, topicStats, weakAreas, strengthAreas, streak, recentSessions, difficultyDist, accuracyByDifficulty, sessionModeStats] = await Promise.all([
      this.analyticsRepository.getOverallStats(userId),
      this.analyticsRepository.getTopicStats(userId),
      this.analyticsRepository.getWeakAreas(userId, 5),
      this.analyticsRepository.getStrengthAreas(userId, 5),
      this.analyticsRepository.getDailyStreak(userId),
      this.analyticsRepository.getRecentSessions(userId, 5),
      this.analyticsRepository.getDifficultyDistribution(userId),
      this.analyticsRepository.getAccuracyByDifficulty(userId),
      this.analyticsRepository.getSessionModeStats(userId),
    ]);

    return {
      overall: overallStats,
      topics: topicStats,
      weakAreas,
      strengthAreas,
      streak,
      recentSessions,
      difficulty: {
        distribution: difficultyDist,
        accuracyByDifficulty,
      },
      sessionModes: sessionModeStats,
    };
  }

  async getOverallStats(userId: string) {
    return this.analyticsRepository.getOverallStats(userId);
  }

  async getTopicStats(userId: string) {
    return this.analyticsRepository.getTopicStats(userId);
  }

  async getWeakAreas(userId: string, limit: number = 5) {
    return this.analyticsRepository.getWeakAreas(userId, limit);
  }

  async getStrengthAreas(userId: string, limit: number = 5) {
    return this.analyticsRepository.getStrengthAreas(userId, limit);
  }

  async getMostMistakenQuestions(userId: string, limit: number = 10) {
    return this.analyticsRepository.getMostMistakenQuestions(userId, limit);
  }

  async getDailyStreak(userId: string) {
    return this.analyticsRepository.getDailyStreak(userId);
  }

  async getRecentSessions(userId: string, limit: number = 5) {
    return this.analyticsRepository.getRecentSessions(userId, limit);
  }

  async getDifficultyDistribution(userId: string) {
    return this.analyticsRepository.getDifficultyDistribution(userId);
  }

  async getAccuracyByDifficulty(userId: string) {
    return this.analyticsRepository.getAccuracyByDifficulty(userId);
  }

  async getSessionModeStats(userId: string) {
    return this.analyticsRepository.getSessionModeStats(userId);
  }
}
