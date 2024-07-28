import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { SurveyVersion } from './survey.version.entity';
import { SurveyQuestionOption } from './survey.question.option.entity';
import { SurveyResponseDetail } from './survey.response.detail.entity';
import { QuestionType } from '../enums';

@Entity()
export class SurveyQuestion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  surveyVersionId: string;

  @ManyToOne(() => SurveyVersion, (surveyVersion) => surveyVersion.questions)
  surveyVersion: SurveyVersion;

  @Column()
  type: QuestionType;

  @Column()
  text: string;

  @OneToMany(() => SurveyQuestionOption, (option) => option.question, {
    cascade: true,
  })
  options: SurveyQuestionOption[];

  @OneToMany(
    () => SurveyResponseDetail,
    (responseDetail) => responseDetail.question,
  )
  responses: SurveyResponseDetail[];

  @Column()
  sequenceNumber: number;
}
