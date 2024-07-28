import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { SurveyQuestion } from './survey.question.entity';
import { SurveyResponse } from './survey.response.entity';
import { SurveyQuestionOption } from './survey.question.option.entity';

@Entity()
export class SurveyResponseDetail {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => SurveyResponse, (response) => response.responseDetails)
  response: SurveyResponse;

  @Column()
  responseId: string;

  @ManyToOne(() => SurveyQuestion, (question) => question.responses)
  question: SurveyQuestion;

  @Column()
  questionId: string;

  @Column()
  selectedOptionId: string;

  @ManyToOne(() => SurveyQuestionOption, { nullable: true })
  selectedOption: SurveyQuestionOption; // Only for single_select and multi_select

  @Column({ nullable: true })
  freeFormAnswer: string; // Only for free_form
}
