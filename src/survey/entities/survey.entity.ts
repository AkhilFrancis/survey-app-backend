import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { SurveyVersion } from './survey.version.entity';

@Entity()
export class Survey {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @OneToMany(() => SurveyVersion, (surveyVersion) => surveyVersion.survey, {
    cascade: true,
  })
  versions: SurveyVersion[];
}
