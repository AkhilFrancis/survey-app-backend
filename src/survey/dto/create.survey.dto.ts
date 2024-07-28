import { CreateQuestionDto } from './create.question.dto';

export class CreateSurveyDto {
  title: string;
  description: string;
  questions: CreateQuestionDto[];
}
