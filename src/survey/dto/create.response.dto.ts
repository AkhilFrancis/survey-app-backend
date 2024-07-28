import { CreateResponseDetailDto } from './create.response.detail.dto';

export class CreateResponseDto {
  surveyVersionId: string;
  responseDetails: CreateResponseDetailDto[];
}
