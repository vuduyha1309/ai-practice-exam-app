import { VisibilityType, SourceType, ParseStatus } from '@prisma/client';

export class QuestionSetResponseDto {
  id: string;
  title: string;
  description: string | null;
  visibility: VisibilityType;
  sourceType: SourceType;
  aiParseStatus: ParseStatus;
  questionCount: number;
  topicCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export class QuestionSetsPaginatedResponseDto {
  data: QuestionSetResponseDto[];
  meta: {
    total: number;
    page: number;
    limit: number;
  };
}
