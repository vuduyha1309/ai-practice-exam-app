import { IsUUID, IsString, IsArray, IsInt, Min, IsOptional } from 'class-validator';

export class SubmitAnswerDto {
  @IsUUID()
  questionId: string;

  // Single choice: "A" or Multiple choice: ["A", "B", "C"]
  @IsOptional()
  selectedChoiceKeys?: string | string[];

  @IsInt()
  @Min(0)
  timeSpentMs: number;

  @IsOptional()
  aiExplanationViewed?: boolean;
}
