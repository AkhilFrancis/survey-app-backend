import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryRunner, Repository } from 'typeorm';
import { Survey } from '../entities/survey.entity';
import { SurveyVersion } from '../entities/survey.version.entity';
import { SurveyQuestion } from '../entities/survey.question.entity';
import { SurveyQuestionOption } from '../entities/survey.question.option.entity';
import { CreateQuestionDto } from '../dto/create.question.dto';
import { CreateSurveyDto } from '../dto/create.survey.dto';
import { SurveyResponse } from '../entities/survey.response.entity';

@Injectable()
export class SurveyService {
  constructor(
    @InjectRepository(Survey)
    private surveyRepository: Repository<Survey>,
    @InjectRepository(SurveyVersion)
    private surveyVersionRepository: Repository<SurveyVersion>,
    @InjectRepository(SurveyQuestion)
    private surveyQuestionRepository: Repository<SurveyQuestion>,
    @InjectRepository(SurveyQuestionOption)
    private surveyQuestionOptionRepository: Repository<SurveyQuestionOption>,
    @InjectRepository(SurveyResponse)
    private surveyResponseRepository: Repository<SurveyResponse>,
  ) {}

  async create(createSurveyDto: CreateSurveyDto): Promise<Survey> {
    const { title, description, questions } = createSurveyDto;

    // Create the survey
    const survey = this.surveyRepository.create({ title, description });
    await this.surveyRepository.save(survey);

    // Create the first version of the survey
    const surveyVersion = this.surveyVersionRepository.create({
      survey,
      version: 1,
    });
    await this.surveyVersionRepository.save(surveyVersion);

    // Create questions and options for the survey version
    await this.createQuestionsAndOptions(surveyVersion, questions);

    return survey;
  }

  private async createQuestionsAndOptions(
    surveyVersion: SurveyVersion,
    questions: CreateQuestionDto[],
  ) {
    for (const questionDto of questions) {
      // Create the question
      const question = this.surveyQuestionRepository.create({
        type: questionDto.type,
        text: questionDto.text,
        sequenceNumber: questionDto.sequenceNumber,
        surveyVersion,
      });
      await this.surveyQuestionRepository.save(question);

      // Create options for the question
      if (questionDto.options) {
        for (const optionDto of questionDto.options) {
          const option = this.surveyQuestionOptionRepository.create({
            text: optionDto.text,
            sequenceNumber: optionDto.sequenceNumber,
            question,
          });
          await this.surveyQuestionOptionRepository.save(option);
        }
      }
    }
  }

  async getLatestVersion(surveyId: string) {
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
    const latestVersion = survey.versions.reduce(
      (latest, version) =>
        version.version > latest.version ? version : latest,
      survey.versions[0],
    );

    return {
      title: survey.title,
      id: surveyId,
      description: survey.description,
      version: latestVersion,
    };
  }

  public async getUserSurveyVersion(
    surveyId: string,
    userId?: string,
    queryRunner?: QueryRunner,
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

    if (!userId) return this.getLatestVersion(surveyId);

    const surveyResponseRepository = queryRunner
      ? queryRunner.manager.getRepository(SurveyResponse)
      : this.surveyResponseRepository;

    const inProgressResponse = await surveyResponseRepository.findOne({
      where: { userId },
      relations: ['surveyVersion'],
    });

    if (
      inProgressResponse &&
      inProgressResponse.surveyVersion.surveyId === surveyId
    ) {
      const userSurveyVersion = await this.getSurveyVersion(
        surveyId,
        inProgressResponse.surveyVersion.id,
      );
      return {
        title: survey.title,
        id: survey.id,
        description: survey.description,
        version: userSurveyVersion,
      };
    }
    return this.getLatestVersion(surveyId);
  }

  async getSurveyVersion(
    surveyId: string,
    versionId: string,
  ): Promise<SurveyVersion> {
    return await this.surveyVersionRepository
      .createQueryBuilder('surveyVersion')
      .leftJoinAndSelect('surveyVersion.questions', 'questions')
      .leftJoinAndSelect('questions.options', 'options')
      .where('surveyVersion.id = :versionId', { versionId })
      .andWhere('surveyVersion.surveyId = :surveyId', { surveyId })
      .getOne();
  }

  async editSurvey(
    surveyId: string,
    updateSurveyDto: CreateSurveyDto,
  ): Promise<SurveyVersion> {
    const latestVersion = await this.getLatestVersion(surveyId);

    // Create a new version based on the latest version
    const newVersion = this.surveyVersionRepository.create({
      surveyId: latestVersion.id,
      version: latestVersion.version.version + 1,
    });
    const savedNewVersion = await this.surveyVersionRepository.save(newVersion);

    const { title, description, questions } = updateSurveyDto;

    const survey = await this.surveyRepository.findOne({
      where: { id: surveyId },
    });

    if (survey) {
      if (title) {
        survey.title = title;
      }

      if (description) {
        survey.description = description;
      }

      await this.surveyRepository.save(survey);
    } else {
      throw new Error('Survey not found');
    }

    // Create new questions and options for the new version
    await this.createQuestionsAndOptions(savedNewVersion, questions);

    return savedNewVersion;
  }

  async getAllSurveysWithVersions(): Promise<Survey[]> {
    return this.surveyRepository.find({
      relations: [
        'versions',
        'versions.questions',
        'versions.questions.options',
      ],
    });
  }

  async getAllSurveys(userId?: string): Promise<any[]> {
    const surveys = await this.surveyRepository.find();

    if (!userId) {
      return surveys.map((survey) => ({
        ...survey,
        completed: false,
      }));
    }

    const responses = await this.surveyResponseRepository.find({
      where: { userId },
      relations: ['surveyVersion'],
    });

    return surveys.map((survey) => {
      const completed = responses.some(
        (response) =>
          response.surveyVersion.surveyId === survey.id && response.isComplete,
      );
      return {
        ...survey,
        completed,
      };
    });
  }
}
