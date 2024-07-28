export class CreateResponseDetailDto {
  questionId: string;
  selectedOptionIds?: string[]; // Updated to handle multiple selected options
  freeFormAnswer?: string;
}
