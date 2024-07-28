import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Survey } from './entities/survey.entity';
import { SurveyVersion } from './entities/survey.version.entity';
import { SurveyQuestion } from './entities/survey.question.entity';
import { SurveyQuestionOption } from './entities/survey.question.option.entity';
import { SurveyResponse } from './entities/survey.response.entity';
import { SurveyResponseDetail } from './entities/survey.response.detail.entity';
import { SurveyService } from './service/survey.service';
import { SurveyController } from './controller/survey.controller';
import { AuthModule } from '../auth/auth.module';
import { SurveyResponseController } from './controller/survey.response.controller';
import { SurveyResponseService } from './service/survey.response.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Survey,
      SurveyVersion,
      SurveyQuestion,
      SurveyQuestionOption,
      SurveyResponse,
      SurveyResponseDetail,
    ]),
    AuthModule,
  ],
  controllers: [SurveyController, SurveyResponseController],
  providers: [SurveyService, SurveyResponseService],
})
export class SurveyModule {}
