import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { SurveyQuestion } from './survey.question.entity';

@Entity()
export class SurveyQuestionOption {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  questionId: string;

  @ManyToOne(() => SurveyQuestion, (question) => question.options)
  question: SurveyQuestion;

  @Column()
  text: string;

  @Column()
  sequenceNumber: number;
}
