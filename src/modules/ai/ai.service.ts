import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, Part } from '@google/generative-ai';

export interface ParseInput {
  type: 'text' | 'image';
  mimeType?: string;
  data: string; // text content or base64 for image
}

export interface Choice {
  key: string;
  content: string;
  contentVi?: string;
  isCorrect: boolean;
}

export interface Question {
  content: string;
  choices: Choice[];
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  suggestedTopic: string;
  confidenceScore: number;
}

export interface ParseResult {
  suggestedTopics: string[];
  questions: Question[];
}

const PARSE_PROMPT = `Bạn là AI chuyên parse đề thi trắc nghiệm. Phân tích nội dung và trả về JSON theo format sau, KHÔNG thêm bất kỳ text nào khác ngoài JSON:

{
  "suggestedTopics": ["Topic A", "Topic B"],
  "questions": [
    {
      "content": "Nội dung câu hỏi",
      "choices": [
        { "key": "A", "content": "Đáp án A", "isCorrect": false },
        { "key": "B", "content": "Đáp án B", "isCorrect": true },
        { "key": "C", "content": "Đáp án C", "isCorrect": false },
        { "key": "D", "content": "Đáp án D", "isCorrect": false }
      ],
      "explanation": "Giải thích tại sao đáp án đúng",
      "difficulty": "medium",
      "suggestedTopic": "Topic A",
      "confidenceScore": 0.95
    }
  ]
}

Quy tắc:
- difficulty: "easy" | "medium" | "hard"
- confidenceScore: 0.0 - 1.0 (mức độ chắc chắn khi parse, thấp nếu ảnh mờ hoặc text không rõ)
- Nếu không xác định được đáp án đúng, isCorrect tất cả = false và confidenceScore < 0.5
- suggestedTopic phải là một trong các giá trị của suggestedTopics`;

const GENERATE_QUIZ_PROMPT = `Bạn là AI giáo dục chuyên tạo bộ đề trắc nghiệm từ tài liệu. Dựa trên tài liệu được cung cấp, hãy tạo 5-10 câu hỏi trắc nghiệm để kiểm tra hiểu biết. Trả về JSON theo format sau, KHÔNG thêm bất kỳ text nào khác ngoài JSON:

{
  "suggestedTopics": ["Topic A", "Topic B"],
  "questions": [
    {
      "content": "Nội dung câu hỏi trắc nghiệm",
      "choices": [
        { "key": "A", "content": "Đáp án A", "isCorrect": false },
        { "key": "B", "content": "Đáp án B", "isCorrect": true },
        { "key": "C", "content": "Đáp án C", "isCorrect": false },
        { "key": "D", "content": "Đáp án D", "isCorrect": false }
      ],
      "explanation": "Giải thích chi tiết tại sao đáp án B là đúng",
      "difficulty": "medium",
      "suggestedTopic": "Topic A",
      "confidenceScore": 0.9
    }
  ]
}

Quy tắc:
- Tạo câu hỏi dựa trên nội dung chính của tài liệu
- difficulty: "easy" | "medium" | "hard" (phân bố hợp lý)
- confidenceScore: 0.7 - 1.0 (luôn cao vì tạo từ tài liệu rõ ràng)
- Mỗi câu hỏi phải có 4 đáp án, chỉ 1 đáp án đúng
- Giải thích phải dẫn chứng từ tài liệu`;

@Injectable()
export class AiService {
  private client: GoogleGenerativeAI;

  constructor(private config: ConfigService) {
    const apiKey = this.config.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }
    this.client = new GoogleGenerativeAI(apiKey);
  }

  async parseDocument(input: ParseInput): Promise<ParseResult> {
    const model = this.client.getGenerativeModel({ model: 'gemini-3.5-flash' });

    let parts: Part[];

    if (input.type === 'image') {
      if (!input.mimeType) {
        throw new BadRequestException('mimeType required for image');
      }
      parts = [
        {
          inlineData: {
            mimeType: input.mimeType,
            data: input.data,
          },
        },
        {
          text: PARSE_PROMPT,
        },
      ];
    } else {
      parts = [
        {
          text: PARSE_PROMPT + '\n\n' + input.data,
        },
      ];
    }

    try {
      const result = await model.generateContent({
        contents: [
          {
            role: 'user',
            parts,
          },
        ],
      });

      const response = result.response;
      const text = response.text();
      return this.parseAiResponse(text);
    } catch (error) {
      throw new BadRequestException(`AI parse failed: ${error.message}`);
    }
  }

  async generateQuizFromDocument(documentText: string): Promise<ParseResult> {
    const model = this.client.getGenerativeModel({ model: 'gemini-3.5-flash' });

    const prompt = GENERATE_QUIZ_PROMPT + '\n\n**TÀI LIỆU:**\n' + documentText;

    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      return this.parseAiResponse(text);
    } catch (error) {
      throw new BadRequestException(`Quiz generation failed: ${error.message}`);
    }
  }

  async generateExplanation(question: string, correctAnswer: string): Promise<string> {
    const model = this.client.getGenerativeModel({ model: 'gemini-3.5-flash' });

    const prompt = `Giải thích tại sao đáp án đúng là "${correctAnswer}" cho câu hỏi sau:\n\n${question}`;

    try {
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      throw new BadRequestException(`Explanation generation failed: ${error.message}`);
    }
  }

  private parseAiResponse(text: string): ParseResult {
    try {
      const clean = text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);

      // Validate structure
      if (!Array.isArray(parsed.suggestedTopics) || !Array.isArray(parsed.questions)) {
        throw new Error('Invalid response structure');
      }

      return parsed as ParseResult;
    } catch (error) {
      throw new BadRequestException(`Failed to parse AI response: ${error.message}`);
    }
  }
}
