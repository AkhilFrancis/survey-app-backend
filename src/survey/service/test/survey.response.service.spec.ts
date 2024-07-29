import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Survey } from '../../entities/survey.entity';
import { SurveyResponseDetail } from '../../entities/survey.response.detail.entity';
import { SurveyResponse } from '../../entities/survey.response.entity';
import { SurveyVersion } from '../../entities/survey.version.entity';
import { SurveyQuestion } from '../../entities/survey.question.entity';
import { Repository, Connection, In } from 'typeorm';
import { SurveyResponseService } from '../survey.response.service';
import { SurveyService } from '../survey.service';
import { CreateResponseDetailDto } from '../../dto/create.response.detail.dto';
import { CreateResponseDto } from '../../dto/create.response.dto';

describe('SurveyResponseService', () => {
  let service: SurveyResponseService;
  let surveyResponseRepository: Repository<SurveyResponse>;
  let surveyResponseDetailRepository: Repository<SurveyResponseDetail>;
  let surveyRepository: Repository<Survey>;
  let connection: Connection;
  let surveyService: SurveyService;
  let queryRunner: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SurveyResponseService,
        {
          provide: getRepositoryToken(SurveyResponse),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(SurveyResponseDetail),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Survey),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(SurveyQuestion),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: Connection,
          useValue: {
            createQueryRunner: jest.fn().mockReturnValue({
              connect: jest.fn(),
              startTransaction: jest.fn(),
              commitTransaction: jest.fn(),
              rollbackTransaction: jest.fn(),
              release: jest.fn(),
              manager: {
                findOne: jest.fn(),
                save: jest.fn(),
                delete: jest.fn(),
                update: jest.fn(),
                query: jest.fn(),
              },
            }),
          },
        },
        {
          provide: SurveyService,
          useValue: {
            getLatestVersion: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SurveyResponseService>(SurveyResponseService);
    surveyResponseRepository = module.get<Repository<SurveyResponse>>(
      getRepositoryToken(SurveyResponse),
    );
    surveyResponseDetailRepository = module.get<
      Repository<SurveyResponseDetail>
    >(getRepositoryToken(SurveyResponseDetail));
    surveyRepository = module.get<Repository<Survey>>(
      getRepositoryToken(Survey),
    );
    connection = module.get<Connection>(Connection);
    surveyService = module.get<SurveyService>(SurveyService);
    queryRunner = connection.createQueryRunner();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
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
      (surveyService.getLatestVersion as jest.Mock).mockResolvedValue({
        title: survey.title,
        id: survey.id,
        description: survey.description,
        version: survey.versions[1],
      });

      const result = await service.getUserSurveyVersion('1', queryRunner);

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
      inProgressResponse.surveyVersion = survey.versions[0];

      (surveyRepository.findOne as jest.Mock).mockResolvedValue(survey);
      (queryRunner.manager.findOne as jest.Mock).mockResolvedValue(
        inProgressResponse,
      );

      const result = await service.getUserSurveyVersion(
        '1',
        queryRunner,
        'user1',
      );

      expect(result).toEqual({
        title: survey.title,
        id: survey.id,
        description: survey.description,
        version: survey.versions[0],
      });
    });
  });

  describe('submitResponseDetail', () => {
    it('should submit a response detail', async () => {
      const surveyId = '1';
      const createResponseDetailDto: CreateResponseDetailDto = {
        questionId: 'q1',
        selectedOptionIds: ['o1'],
        freeFormAnswer: null,
      };

      const surveyVersion = { id: '1', version: 1 } as SurveyVersion;
      const response = {
        id: '1',
        surveyVersion,
        responseDetails: [],
      } as SurveyResponse;

      jest
        .spyOn<any, any>(service, 'findOrCreateResponse')
        .mockResolvedValue(response);
      jest
        .spyOn<any, any>(service, 'saveResponseDetail')
        .mockResolvedValue(undefined);
      jest
        .spyOn<any, any>(service, 'checkAndMarkCompletion')
        .mockResolvedValue(undefined);

      const result = await service.submitResponseDetail(
        surveyId,
        createResponseDetailDto,
      );

      expect(service['findOrCreateResponse']).toHaveBeenCalledWith(
        expect.anything(),
        surveyId,
        undefined,
      );
      expect(service['saveResponseDetail']).toHaveBeenCalledWith(
        expect.anything(),
        response,
        createResponseDetailDto,
      );
      expect(service['checkAndMarkCompletion']).toHaveBeenCalledWith(
        expect.anything(),
        response,
        response.surveyVersionId,
      );
      expect(result).toEqual(response);
    });
  });

  describe('submitResponse', () => {
    it('should submit a response and save response details', async () => {
      const surveyId = '1';
      const createResponseDto: CreateResponseDto = {
        surveyVersionId: '1',
        responseDetails: [
          {
            questionId: 'q1',
            selectedOptionIds: ['o1'],
            freeFormAnswer: null,
          },
        ],
      };

      const surveyVersion = { id: '1', version: 1 } as SurveyVersion;
      const response = {
        id: '1',
        surveyVersion,
        responseDetails: [],
      } as SurveyResponse;

      jest
        .spyOn<any, any>(service, 'findOrCreateResponse')
        .mockResolvedValue(response);
      jest
        .spyOn<any, any>(service, 'saveResponseDetail')
        .mockResolvedValue(undefined);
      jest
        .spyOn<any, any>(service, 'checkAndMarkCompletion')
        .mockResolvedValue(undefined);

      const result = await service.submitResponse(surveyId, createResponseDto);

      expect(service['findOrCreateResponse']).toHaveBeenCalledWith(
        expect.anything(),
        surveyId,
        undefined,
      );
      expect(service['saveResponseDetail']).toHaveBeenCalledWith(
        expect.anything(),
        response,
        createResponseDto.responseDetails[0],
      );
      expect(service['checkAndMarkCompletion']).toHaveBeenCalledWith(
        expect.anything(),
        response,
        response.surveyVersionId,
      );
      expect(result).toEqual(response);
    });
  });

  describe('getResponse', () => {
    it('should get the response for a given survey and user', async () => {
      const surveyId = '1';
      const userId = 'user1';

      const surveyVersion = {
        id: '1',
        version: 1,
        surveyId: surveyId,
      } as SurveyVersion;

      const response = {
        id: '1',
        surveyVersionId: surveyVersion.id,
        userId: userId,
        responseDetails: [
          {
            questionId: 'q1',
            selectedOptionId: 'o1',
            freeFormAnswer: null,
            question: { text: 'Question 1' },
            selectedOption: { text: 'Option 1' },
          },
        ],
      } as any;

      jest.spyOn(service, 'getUserSurveyVersion').mockResolvedValue({
        title: 'Survey',
        id: surveyId,
        description: 'Description',
        version: surveyVersion,
      });
      (surveyResponseRepository.findOne as jest.Mock).mockResolvedValue(
        response,
      );

      const result = await service.getResponse(surveyId, userId);

      expect(service.getUserSurveyVersion).toHaveBeenCalledWith(
        surveyId,
        expect.anything(),
        userId,
      );
      expect(surveyResponseRepository.findOne).toHaveBeenCalledWith({
        where: { surveyVersionId: surveyVersion.id, userId },
        relations: [
          'responseDetails',
          'responseDetails.question',
          'responseDetails.selectedOption',
        ],
      });
      expect(result).toEqual({
        surveyId: response.surveyVersionId,
        userId: response.userId,
        responseDetails: [
          {
            questionId: 'q1',
            freeFormAnswer: null,
            selectedOptionIds: ['o1'],
          },
        ],
      });
    });
  });

  describe('getResponses', () => {
    it('should get all responses for a given survey', async () => {
      const surveyId = '1';

      const survey = {
        id: surveyId,
        title: 'Survey 1',
        description: 'Description 1',
        versions: [
          {
            id: '1',
            version: 1,
          },
        ],
      } as Survey;

      const responses = [
        {
          surveyVersionId: '1',
          userId: 'user1',
          user: { id: 'user1', name: 'User 1' },
          responseDetails: [
            {
              questionId: 'q1',
              question: { text: 'Question 1' },
              selectedOption: { id: 'o1', text: 'Option 1' },
              freeFormAnswer: null,
            },
          ],
        },
      ];

      (surveyRepository.findOne as jest.Mock).mockResolvedValue(survey);
      (surveyResponseRepository.find as jest.Mock).mockResolvedValue(responses);

      const result = await service.getResponses(surveyId);

      expect(surveyRepository.findOne).toHaveBeenCalledWith({
        where: { id: surveyId },
        relations: ['versions'],
      });
      expect(surveyResponseRepository.find).toHaveBeenCalledWith({
        where: { surveyVersion: In(['1']) },
        relations: [
          'responseDetails',
          'responseDetails.question',
          'responseDetails.selectedOption',
          'user',
        ],
      });
      expect(result).toEqual({
        survey: {
          id: survey.id,
          title: survey.title,
          description: survey.description,
        },
        responses: [
          {
            version: {
              id: '1',
              version: 1,
            },
            responses: [
              {
                user: { id: 'user1', name: 'User 1' },
                responseDetails: [
                  {
                    questionId: 'q1',
                    questionText: 'Question 1',
                    selectedOption: {
                      id: 'o1',
                      text: 'Option 1',
                    },
                    freeFormAnswer: null,
                  },
                ],
              },
            ],
          },
        ],
      });
    });
  });
});
