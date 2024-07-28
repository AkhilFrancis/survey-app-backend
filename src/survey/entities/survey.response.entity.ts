import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { SurveyVersion } from './survey.version.entity';
import { SurveyResponseDetail } from './survey.response.detail.entity';

@Entity()
export class SurveyResponse {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.responses, { nullable: true })
  user: User;

  @Column({ nullable: true })
  userId: string;

  @ManyToOne(() => SurveyVersion, (surveyVersion) => surveyVersion.responses)
  surveyVersion: SurveyVersion;

  @Column()
  surveyVersionId: string;

  @OneToMany(
    () => SurveyResponseDetail,
    (responseDetail) => responseDetail.response,
    { cascade: true },
  )
  responseDetails: SurveyResponseDetail[];

  @Column({ default: false })
  isComplete: boolean;
}
