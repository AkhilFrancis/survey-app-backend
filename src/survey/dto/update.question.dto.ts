import { QuestionType } from '../enums';
import { CreateOptionDto } from './create.option.dto';

export class UpdateQuestionDto {
  id?: string;
  type?: QuestionType;
  text?: string;
  options?: CreateOptionDto[];
}
