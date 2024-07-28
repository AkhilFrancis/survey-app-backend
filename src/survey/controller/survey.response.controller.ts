import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Param,
  UnauthorizedException,
  Query,
  ClassSerializerInterceptor,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { SurveyResponseService } from '../service/survey.response.service';
import { CreateResponseDetailDto } from '../dto/create.response.detail.dto';
import { CreateResponseDto } from '../dto/create.response.dto';
import { Roles } from 'src/auth/decorator/roles.decorator';

@Controller('survey-response')
@UseGuards(AuthGuard)
export class SurveyResponseController {
  constructor(private readonly surveyResponseService: SurveyResponseService) {}

  @Post(':surveyId/detail')
  async submitResponseDetail(
    @Param('surveyId') surveyId: string,
    @Body() createResponseDetailDto: CreateResponseDetailDto,
    @Request() req,
  ) {
    const user = req.user; // May be undefined if not authenticated
    return this.surveyResponseService.submitResponseDetail(
      surveyId,
      createResponseDetailDto,
      user,
    );
  }

  @Post(':surveyId/batch')
  async submitBatchResponse(
    @Param('surveyId') surveyId: string,
    @Body() createResponseDto: CreateResponseDto,
    @Request() req,
  ) {
    const user = req.user; // May be undefined if not authenticated
    return this.surveyResponseService.submitResponse(
      surveyId,
      createResponseDto,
      user,
    );
  }

  @Get(':surveyId')
  async getResponse(@Param('surveyId') surveyId: string, @Request() req) {
    const userId = req.user ? req.user.id : null;
    if (!userId) {
      throw new UnauthorizedException();
    }
    return this.surveyResponseService.getResponse(surveyId, userId);
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @Get(':surveyId/responses')
  @Roles('admin')
  async getResponses(
    @Param('surveyId') surveyId: string,
    @Query('versionId') versionId?: string,
  ) {
    return this.surveyResponseService.getResponses(surveyId, versionId);
  }
}
