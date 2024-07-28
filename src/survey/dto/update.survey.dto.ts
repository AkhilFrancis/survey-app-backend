import { UpdateQuestionDto } from './update.question.dto';

export class UpdateSurveyDto {
  title?: string;
  description?: string;
  questions: UpdateQuestionDto[];
}
