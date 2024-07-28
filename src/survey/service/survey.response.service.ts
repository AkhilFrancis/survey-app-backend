import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Connection, QueryRunner, In } from 'typeorm';
import { SurveyResponse } from '../entities/survey.response.entity';
import { SurveyResponseDetail } from '../entities/survey.response.detail.entity';
import { SurveyVersion } from '../entities/survey.version.entity';
import { SurveyQuestion } from '../entities/survey.question.entity';
import { User } from 'src/user/entities/user.entity';
import { CreateResponseDetailDto } from '../dto/create.response.detail.dto';
import { SurveyService } from './survey.service';
import { Survey } from '../entities/survey.entity';
import { CreateResponseDto } from '../dto/create.response.dto';

@Injectable()
export class SurveyResponseService {
  constructor(
    @InjectRepository(SurveyResponse)
    private surveyResponseRepository: Repository<SurveyResponse>,
    @InjectRepository(SurveyResponseDetail)
    private surveyResponseDetailRepository: Repository<SurveyResponseDetail>,
    @InjectRepository(Survey)
    private surveyRepository: Repository<Survey>,
    private surveyService: SurveyService,
    private connection: Connection,
  ) {}

  private async findOrCreateResponse(
    queryRunner: QueryRunner,
    surveyId: string,
    user?: User,
  ): Promise<SurveyResponse> {
    const userId = user ? user.id : null;
    const surveyVersion = await this.getUserSurveyVersion(
      surveyId,
      queryRunner,
      userId,
    );

    let response: SurveyResponse;

    if (userId) {
      // Check for an in-progress response for authenticated users
      response = await queryRunner.manager.findOne(SurveyResponse, {
        where: { surveyVersionId: surveyVersion.version.id, userId },
        relations: ['responseDetails'],
      });
    }

    if (!response) {
      // Create a new response for anonymous users or if no in-progress response exists
      response = this.surveyResponseRepository.create({
        surveyVersionId: surveyVersion.version.id,
        user,
        userId: user ? user.id : null,
        responseDetails: [],
      });
      await queryRunner.manager.save(response);
    }

    return response;
  }

  public async getUserSurveyVersion(
    surveyId: string,
    queryRunner: QueryRunner,
    userId?: string,
  ) {
    const survey = await this.surveyRepository.findOne({
      where: { id: surveyId },
      relations: [
        'versions',
        'versions.questions',
        'versions.questions.options',
      ],
    });

    if (!survey) {
      throw new Error('Survey not found');
    }

    if (userId) {
      const inProgressResponse = await queryRunner.manager.findOne(
        SurveyResponse,
        {
          where: { userId, surveyVersion: { surveyId } },
          relations: ['surveyVersion'],
        },
      );

      if (inProgressResponse) {
        return {
          title: survey.title,
          id: survey.id,
          description: survey.description,
          version: inProgressResponse.surveyVersion,
        };
      }
    }

    return this.surveyService.getLatestVersion(surveyId);
  }

  private async saveResponseDetail(
    queryRunner: QueryRunner,
    response: SurveyResponse,
    detailDto: CreateResponseDetailDto,
  ) {
    const question = await queryRunner.manager.findOne(SurveyQuestion, {
      where: { id: detailDto.questionId },
    });
    if (!question) {
      throw new Error('Question not found');
    }

    if (question.type === 'MULTI_SELECT') {
      // Clear existing details for multi-select questions
      await queryRunner.manager.delete(SurveyResponseDetail, {
        responseId: response.id,
        questionId: detailDto.questionId,
      });
    }

    if (question.type === 'MULTI_SELECT' && detailDto.selectedOptionIds) {
      for (const selectedOptionId of detailDto.selectedOptionIds) {
        const responseDetail = this.surveyResponseDetailRepository.create({
          response,
          responseId: response.id,
          question,
          questionId: detailDto.questionId,
          selectedOptionId,
        });
        await queryRunner.manager.save(responseDetail);
      }
    } else {
      let responseDetail = response.responseDetails.find(
        (detail) => detail.questionId === detailDto.questionId,
      );

      if (!responseDetail) {
        responseDetail = this.surveyResponseDetailRepository.create({
          response,
          responseId: response.id,
          question,
          questionId: detailDto.questionId,
        });
      }

      responseDetail.selectedOptionId =
        detailDto.selectedOptionIds && detailDto.selectedOptionIds.length
          ? detailDto.selectedOptionIds[0]
          : null;
      responseDetail.freeFormAnswer = detailDto.freeFormAnswer;

      await queryRunner.manager.save(responseDetail);
    }
  }

  async submitResponseDetail(
    surveyId: string,
    createResponseDetailDto: CreateResponseDetailDto,
    user?: User,
  ): Promise<SurveyResponse> {
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const response = await this.findOrCreateResponse(
        queryRunner,
        surveyId,
        user,
      );
      await this.saveResponseDetail(
        queryRunner,
        response,
        createResponseDetailDto,
      );
      await this.checkAndMarkCompletion(
        queryRunner,
        response,
        response.surveyVersionId,
      );
      await queryRunner.commitTransaction();
      return response;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async submitResponse(
    surveyId: string,
    createResponseDto: CreateResponseDto,
    user?: User,
  ): Promise<SurveyResponse> {
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const response = await this.findOrCreateResponse(
        queryRunner,
        surveyId,
        user,
      );

      for (const detailDto of createResponseDto.responseDetails) {
        await this.saveResponseDetail(queryRunner, response, detailDto);
      }

      await this.checkAndMarkCompletion(
        queryRunner,
        response,
        response.surveyVersionId,
      );
      await queryRunner.commitTransaction();
      return response;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async checkAndMarkCompletion(
    queryRunner: QueryRunner,
    response: SurveyResponse,
    surveyVersionId: string,
  ) {
    const surveyVersion = await queryRunner.manager.findOne(SurveyVersion, {
      where: { id: surveyVersionId },
      relations: ['questions'],
    });

    if (!surveyVersion) {
      throw new Error('Survey version not found');
    }

    const totalQuestions = surveyVersion.questions.length;

    const answeredQuestionsCountResult = await queryRunner.manager.query(
      `SELECT COUNT(DISTINCT "questionId") FROM "survey_response_detail" WHERE "responseId" = $1`,
      [response.id],
    );

    const answeredQuestionsCount = parseInt(
      answeredQuestionsCountResult[0].count,
      10,
    );

    if (answeredQuestionsCount === totalQuestions) {
      await queryRunner.manager.update(
        SurveyResponse,
        { id: response.id },
        { isComplete: true },
      );
    }
  }

  async getResponse(surveyId: string, userId: string): Promise<any> {
    const surveyVersion = await this.getUserSurveyVersion(
      surveyId,
      this.connection.createQueryRunner(),
      userId,
    );

    const response = await this.surveyResponseRepository.findOne({
      where: { surveyVersionId: surveyVersion.version.id, userId },
      relations: [
        'responseDetails',
        'responseDetails.question',
        'responseDetails.selectedOption',
      ],
    });

    if (!response) {
      throw new Error('No response found for the given survey and user.');
    }

    // Aggregate the response details
    const responseDetailsMap = new Map();

    response.responseDetails.forEach((detail) => {
      if (!responseDetailsMap.has(detail.questionId)) {
        responseDetailsMap.set(detail.questionId, {
          questionId: detail.questionId,
          freeFormAnswer: detail.freeFormAnswer,
          selectedOptionIds: detail.selectedOptionId
            ? [detail.selectedOptionId]
            : [],
        });
      } else {
        const existingDetail = responseDetailsMap.get(detail.questionId);
        if (detail.selectedOptionId) {
          existingDetail.selectedOptionIds.push(detail.selectedOptionId);
        }
        if (detail.freeFormAnswer) {
          existingDetail.freeFormAnswer = detail.freeFormAnswer;
        }
      }
    });

    const simplifiedResponse = {
      surveyId: response.surveyVersionId,
      userId: response.userId,
      responseDetails: Array.from(responseDetailsMap.values()),
    };

    return simplifiedResponse;
  }

  async getResponses(surveyId: string, versionId?: string): Promise<any> {
    const survey = await this.surveyRepository.findOne({
      where: { id: surveyId },
      relations: ['versions'],
    });

    if (!survey) {
      throw new Error('Survey not found');
    }

    let versions = survey.versions;
    if (versionId) {
      versions = versions.filter((version) => version.id === versionId);
    }

    const responses = await this.surveyResponseRepository.find({
      where: { surveyVersion: In(versions.map((version) => version.id)) },
      relations: [
        'responseDetails',
        'responseDetails.question',
        'responseDetails.selectedOption',
        'user',
      ],
    });

    const groupedResponses = versions.map((version) => {
      const versionResponses = responses.filter(
        (response) => response.surveyVersionId === version.id,
      );
      return {
        version: {
          id: version.id,
          version: version.version,
        },
        responses: versionResponses.map((response) => ({
          user: response.user || { id: 'anonymous', name: 'Anonymous' },
          responseDetails: response.responseDetails.map((detail) => ({
            questionId: detail.questionId,
            questionText: detail.question.text, // Include question text
            selectedOption: detail.selectedOption
              ? {
                  id: detail.selectedOption.id,
                  text: detail.selectedOption.text, // Include selected option text
                }
              : null,
            freeFormAnswer: detail.freeFormAnswer,
          })),
        })),
      };
    });

    return {
      survey: {
        id: survey.id,
        title: survey.title,
        description: survey.description,
      },
      responses: groupedResponses,
    };
  }
}
