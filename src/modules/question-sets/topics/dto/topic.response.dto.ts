export class TopicResponseDto {
  id: string;
  name: string;
  aiSuggestedName: string | null;
  confirmedByUser: boolean;
  sortOrder: number;
  questionCount: number;
  createdAt: Date;
}
