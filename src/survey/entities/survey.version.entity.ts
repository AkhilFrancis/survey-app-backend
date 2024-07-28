import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Survey } from './survey.entity';
import { SurveyQuestion } from './survey.question.entity';
import { SurveyResponse } from './survey.response.entity';

@Entity()
export class SurveyVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  surveyId: string;

  @ManyToOne(() => Survey, (survey) => survey.versions)
  survey: Survey;

  @Column()
  version: number;

  @OneToMany(() => SurveyQuestion, (question) => question.surveyVersion, {
    cascade: true,
  })
  questions: SurveyQuestion[];

  @OneToMany(() => SurveyResponse, (response) => response.surveyVersion)
  responses: SurveyResponse[];
}
