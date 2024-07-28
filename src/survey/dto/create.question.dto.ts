import { QuestionType } from '../enums';
import { CreateOptionDto } from './create.option.dto';

export class CreateQuestionDto {
  type: QuestionType;
  text: string;
  sequenceNumber: number;
  options?: CreateOptionDto[];
}
