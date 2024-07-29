import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SurveyService } from '../survey.service';
import { CreateSurveyDto } from '../../dto/create.survey.dto';
import { Survey } from '../../entities/survey.entity';
import { SurveyQuestion } from '../../entities/survey.question.entity';
import { SurveyQuestionOption } from '../../entities/survey.question.option.entity';
import { SurveyResponse } from '../../entities/survey.response.entity';
import { SurveyVersion } from '../../entities/survey.version.entity';
import { QuestionType } from '../../enums';

describe('SurveyService', () => {
  let service: SurveyService;
  let surveyRepository: Repository<Survey>;
  let surveyVersionRepository: Repository<SurveyVersion>;
  let surveyQuestionRepository: Repository<SurveyQuestion>;
  let surveyQuestionOptionRepository: Repository<SurveyQuestionOption>;
  let surveyResponseRepository: Repository<SurveyResponse>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SurveyService,
        {
          provide: getRepositoryToken(Survey),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(SurveyVersion),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            createQueryBuilder: jest.fn().mockReturnValue({
              leftJoinAndSelect: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              getOne: jest.fn(),
            }),
          },
        },
        {
          provide: getRepositoryToken(SurveyQuestion),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(SurveyQuestionOption),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(SurveyResponse),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SurveyService>(SurveyService);
    surveyRepository = module.get<Repository<Survey>>(
      getRepositoryToken(Survey),
    );
    surveyVersionRepository = module.get<Repository<SurveyVersion>>(
      getRepositoryToken(SurveyVersion),
    );
    surveyQuestionRepository = module.get<Repository<SurveyQuestion>>(
      getRepositoryToken(SurveyQuestion),
    );
    surveyQuestionOptionRepository = module.get<
      Repository<SurveyQuestionOption>
    >(getRepositoryToken(SurveyQuestionOption));
    surveyResponseRepository = module.get<Repository<SurveyResponse>>(
      getRepositoryToken(SurveyResponse),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new survey with questions and options', async () => {
      const createSurveyDto: CreateSurveyDto = {
        title: 'New Survey',
        description: 'Survey Description',
        questions: [
          {
            type: QuestionType.SINGLE_SELECT,
            text: 'Question 1',
            sequenceNumber: 1,
            options: [
              { text: 'Option 1', sequenceNumber: 1 },
              { text: 'Option 2', sequenceNumber: 2 },
            ],
          },
          {
            type: QuestionType.FREE_FORM,
            text: 'Question 2',
            sequenceNumber: 2,
          },
        ],
      };

      const survey = new Survey();
      survey.id = '1';
      survey.title = createSurveyDto.title;
      survey.description = createSurveyDto.description;

      const surveyVersion = new SurveyVersion();
      surveyVersion.id = '1';
      surveyVersion.survey = survey;
      surveyVersion.version = 1;

      const question1 = new SurveyQuestion();
      question1.id = '1';
      question1.text = 'Question 1';
      question1.type = QuestionType.SINGLE_SELECT;
      question1.sequenceNumber = 1;

      const option1 = new SurveyQuestionOption();
      option1.id = '1';
      option1.text = 'Option 1';
      option1.sequenceNumber = 1;

      const option2 = new SurveyQuestionOption();
      option2.id = '2';
      option2.text = 'Option 2';
      option2.sequenceNumber = 2;

      const question2 = new SurveyQuestion();
      question2.id = '2';
      question2.text = 'Question 2';
      question2.type = QuestionType.FREE_FORM;
      question2.sequenceNumber = 2;

      (surveyRepository.create as jest.Mock).mockReturnValue(survey);
      (surveyRepository.save as jest.Mock).mockResolvedValue(survey);
      (surveyVersionRepository.create as jest.Mock).mockReturnValue(
        surveyVersion,
      );
      (surveyVersionRepository.save as jest.Mock).mockResolvedValue(
        surveyVersion,
      );
      (surveyQuestionRepository.create as jest.Mock).mockReturnValue(question1);
      (surveyQuestionRepository.save as jest.Mock).mockResolvedValue(question1);
      (surveyQuestionOptionRepository.create as jest.Mock).mockReturnValue(
        option1,
      );
      (surveyQuestionOptionRepository.save as jest.Mock).mockResolvedValue(
        option1,
      );
      (surveyQuestionOptionRepository.create as jest.Mock).mockReturnValue(
        option2,
      );
      (surveyQuestionOptionRepository.save as jest.Mock).mockResolvedValue(
        option2,
      );
      (surveyQuestionRepository.create as jest.Mock).mockReturnValue(question2);
      (surveyQuestionRepository.save as jest.Mock).mockResolvedValue(question2);

      const result = await service.create(createSurveyDto);

      expect(surveyRepository.create).toHaveBeenCalledWith({
        title: createSurveyDto.title,
        description: createSurveyDto.description,
      });
      expect(surveyRepository.save).toHaveBeenCalledWith(survey);
      expect(surveyVersionRepository.create).toHaveBeenCalledWith({
        survey,
        version: 1,
      });
      expect(surveyVersionRepository.save).toHaveBeenCalledWith(surveyVersion);

      // Check if questions and options were created
      expect(surveyQuestionRepository.create).toHaveBeenCalledTimes(2);
      expect(surveyQuestionRepository.save).toHaveBeenCalledTimes(2);
      expect(surveyQuestionOptionRepository.create).toHaveBeenCalledTimes(2);
      expect(surveyQuestionOptionRepository.save).toHaveBeenCalledTimes(2);

      expect(result).toEqual(survey);
    });
  });

  describe('getLatestVersion', () => {
    it('should return the latest version of the survey', async () => {
      const survey = new Survey();
      survey.id = '1';
      survey.title = 'Survey';
      survey.description = 'Description';
      survey.versions = [
        { id: '1', version: 1 } as SurveyVersion,
        { id: '2', version: 2 } as SurveyVersion,
      ];

      (surveyRepository.findOne as jest.Mock).mockResolvedValue(survey);

      const result = await service.getLatestVersion('1');

      expect(surveyRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
        relations: [
          'versions',
          'versions.questions',
          'versions.questions.options',
        ],
      });
      expect(result).toEqual({
        title: survey.title,
        id: survey.id,
        description: survey.description,
        version: survey.versions[1],
      });
    });

    it('should throw an error if the survey is not found', async () => {
      (surveyRepository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.getLatestVersion('1')).rejects.toThrow(
        'Survey not found',
      );
    });
  });

  describe('getUserSurveyVersion', () => {
    it('should return the latest version if no userId is provided', async () => {
      const survey = new Survey();
      survey.id = '1';
      survey.title = 'Survey';
      survey.description = 'Description';
      survey.versions = [
        { id: '1', version: 1 } as SurveyVersion,
        { id: '2', version: 2 } as SurveyVersion,
      ];

      (surveyRepository.findOne as jest.Mock).mockResolvedValue(survey);

      const result = await service.getUserSurveyVersion('1');

      expect(result).toEqual({
        title: survey.title,
        id: survey.id,
        description: survey.description,
        version: survey.versions[1],
      });
    });

    it('should return the user survey version if an in-progress response exists', async () => {
      const survey = new Survey();
      survey.id = '1';
      survey.title = 'Survey';
      survey.description = 'Description';
      survey.versions = [
        { id: '1', version: 1 } as SurveyVersion,
        { id: '2', version: 2 } as SurveyVersion,
      ];

      const inProgressResponse = new SurveyResponse();
      inProgressResponse.surveyVersion = survey.versions[1];

      (surveyRepository.findOne as jest.Mock).mockResolvedValue(survey);
      (surveyResponseRepository.findOne as jest.Mock).mockResolvedValue(
        inProgressResponse,
      );

      const result = await service.getUserSurveyVersion('1', 'user1');

      expect(result).toEqual({
        title: survey.title,
        id: survey.id,
        description: survey.description,
        version: survey.versions[1],
      });
    });

    it('should return the latest version if no in-progress response exists', async () => {
      const survey = new Survey();
      survey.id = '1';
      survey.title = 'Survey';
      survey.description = 'Description';
      survey.versions = [
        { id: '1', version: 1 } as SurveyVersion,
        { id: '2', version: 2 } as SurveyVersion,
      ];

      (surveyRepository.findOne as jest.Mock).mockResolvedValue(survey);
      (surveyResponseRepository.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.getUserSurveyVersion('1', 'user1');

      expect(result).toEqual({
        title: survey.title,
        id: survey.id,
        description: survey.description,
        version: survey.versions[1],
      });
    });
  });

  describe('getSurveyVersion', () => {
    it('should return the specific survey version', async () => {
      const version = new SurveyVersion();
      version.id = '1';
      version.version = 1;

      (
        surveyVersionRepository.createQueryBuilder().getOne as jest.Mock
      ).mockResolvedValue(version);

      const result = await service.getSurveyVersion('1', '1');

      expect(result).toEqual(version);
    });
  });

  describe('editSurvey', () => {
    it('should create a new version of the survey with updated details', async () => {
      const updateSurveyDto: CreateSurveyDto = {
        title: 'Updated Survey',
        description: 'Updated Description',
        questions: [
          {
            type: QuestionType.SINGLE_SELECT,
            text: 'Updated Question 1',
            sequenceNumber: 1,
            options: [
              { text: 'Updated Option 1', sequenceNumber: 1 },
              { text: 'Updated Option 2', sequenceNumber: 2 },
            ],
          },
        ],
      };

      const survey = new Survey();
      survey.id = '1';
      survey.title = 'Original Survey';
      survey.description = 'Original Description';
      survey.versions = [{ id: '1', version: 1 } as SurveyVersion];

      const latestVersion = {
        id: '1',
        version: 1,
      } as SurveyVersion;

      const newVersion = {
        id: '2',
        surveyId: survey.id,
        version: 2,
      } as SurveyVersion;

      (surveyRepository.findOne as jest.Mock).mockResolvedValue(survey);
      (surveyRepository.save as jest.Mock).mockResolvedValue(survey);
      (surveyVersionRepository.create as jest.Mock).mockReturnValue(newVersion);
      (surveyVersionRepository.save as jest.Mock).mockResolvedValue(newVersion);
      (surveyQuestionRepository.create as jest.Mock).mockResolvedValue(
        {} as any,
      );
      (surveyQuestionRepository.save as jest.Mock).mockResolvedValue({} as any);
      (surveyQuestionOptionRepository.create as jest.Mock).mockResolvedValue(
        {} as any,
      );
      (surveyQuestionOptionRepository.save as jest.Mock).mockResolvedValue(
        {} as any,
      );

      jest.spyOn(service, 'getLatestVersion').mockResolvedValue({
        title: survey.title,
        id: survey.id,
        description: survey.description,
        version: latestVersion,
      });

      const result = await service.editSurvey(survey.id, updateSurveyDto);

      expect(surveyRepository.findOne).toHaveBeenCalledWith({
        where: { id: survey.id },
      });
      expect(surveyRepository.save).toHaveBeenCalledWith(survey);
      expect(surveyVersionRepository.create).toHaveBeenCalledWith({
        surveyId: survey.id,
        version: 2,
      });
      expect(surveyVersionRepository.save).toHaveBeenCalledWith(newVersion);

      // Check if questions and options were created
      expect(surveyQuestionRepository.create).toHaveBeenCalledTimes(1);
      expect(surveyQuestionRepository.save).toHaveBeenCalledTimes(1);
      expect(surveyQuestionOptionRepository.create).toHaveBeenCalledTimes(2);
      expect(surveyQuestionOptionRepository.save).toHaveBeenCalledTimes(2);

      expect(result).toEqual(newVersion);
    });

    it('should throw an error if survey is not found', async () => {
      const updateSurveyDto: CreateSurveyDto = {
        title: 'Updated Survey',
        description: 'Updated Description',
        questions: [
          {
            type: QuestionType.SINGLE_SELECT,
            text: 'Updated Question 1',
            sequenceNumber: 1,
            options: [
              { text: 'Updated Option 1', sequenceNumber: 1 },
              { text: 'Updated Option 2', sequenceNumber: 2 },
            ],
          },
        ],
      };

      (surveyRepository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        service.editSurvey('non-existing-id', updateSurveyDto),
      ).rejects.toThrow('Survey not found');
    });
  });

  describe('getAllSurveysWithVersions', () => {
    it('should return all surveys with their versions', async () => {
      const surveys = [
        {
          id: '1',
          title: 'Survey 1',
          description: 'Description 1',
          versions: [
            {
              id: '1',
              version: 1,
              questions: [],
            },
          ],
        },
      ];

      (surveyRepository.find as jest.Mock).mockResolvedValue(surveys);

      const result = await service.getAllSurveysWithVersions();

      expect(surveyRepository.find).toHaveBeenCalledWith({
        relations: [
          'versions',
          'versions.questions',
          'versions.questions.options',
        ],
      });
      expect(result).toEqual(surveys);
    });
  });

  describe('getAllSurveys', () => {
    it('should return all surveys with completion status for a user', async () => {
      const surveys = [
        { id: '1', title: 'Survey 1', description: 'Description 1' },
        { id: '2', title: 'Survey 2', description: 'Description 2' },
      ];

      const responses = [
        { surveyVersion: { surveyId: '1' }, isComplete: true },
      ];

      (surveyRepository.find as jest.Mock).mockResolvedValue(surveys);
      (surveyResponseRepository.find as jest.Mock).mockResolvedValue(responses);

      const result = await service.getAllSurveys('user1');

      expect(surveyRepository.find).toHaveBeenCalled();
      expect(surveyResponseRepository.find).toHaveBeenCalledWith({
        where: { userId: 'user1' },
        relations: ['surveyVersion'],
      });
      expect(result).toEqual([
        {
          id: '1',
          title: 'Survey 1',
          description: 'Description 1',
          completed: true,
        },
        {
          id: '2',
          title: 'Survey 2',
          description: 'Description 2',
          completed: false,
        },
      ]);
    });

    it('should return all surveys with completion status as false if no userId is provided', async () => {
      const surveys = [
        { id: '1', title: 'Survey 1', description: 'Description 1' },
        { id: '2', title: 'Survey 2', description: 'Description 2' },
      ];

      (surveyRepository.find as jest.Mock).mockResolvedValue(surveys);

      const result = await service.getAllSurveys();

      expect(surveyRepository.find).toHaveBeenCalled();
      expect(result).toEqual([
        {
          id: '1',
          title: 'Survey 1',
          description: 'Description 1',
          completed: false,
        },
        {
          id: '2',
          title: 'Survey 2',
          description: 'Description 2',
          completed: false,
        },
      ]);
    });
  });
});
