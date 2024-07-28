import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  UseGuards,
  Request,
} from '@nestjs/common';
import { SurveyService } from '../service/survey.service';
import { SurveyResponseService } from '../service/survey.response.service';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { CreateSurveyDto } from '../dto/create.survey.dto';
import { Roles } from 'src/auth/decorator/roles.decorator';

@Controller('admin/survey')
@UseGuards(AuthGuard)
export class SurveyController {
  constructor(
    private readonly surveyService: SurveyService,
    private readonly surveyResponseService: SurveyResponseService,
  ) {}

  @Post()
  @Roles('admin')
  create(@Body() createSurveyDto: CreateSurveyDto) {
    return this.surveyService.create(createSurveyDto);
  }

  @Post(':id')
  @Roles('admin')
  edit(@Param('id') id: string, @Body() createSurveyDto: CreateSurveyDto) {
    return this.surveyService.editSurvey(id, createSurveyDto);
  }

  @Get(':id/latest-version')
  getLatestVersion(@Param('id') id: string) {
    return this.surveyService.getLatestVersion(id);
  }

  // For Admin
  @Get(':id/version/:versionId')
  @Roles('admin')
  getSurveyVersion(
    @Param('id') id: string,
    @Param('versionId') versionId: string,
  ) {
    return this.surveyService.getSurveyVersion(id, versionId);
  }

  // Get the survey version the user started or the latest version
  @Get(':id/user-version')
  async getUserSurveyVersion(@Param('id') id: string, @Request() req) {
    const user = req?.user; // May be undefined if not authenticated
    return this.surveyService.getUserSurveyVersion(id, user?.id);
  }

  @Get()
  getAllSurveys(@Request() req) {
    const userId = req.user ? req.user.id : null;
    return this.surveyService.getAllSurveys(userId);
  }

  @Get('with-versions')
  @Roles('admin')
  getAllSurveysWithVersions() {
    return this.surveyService.getAllSurveysWithVersions();
  }
}
