import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../../decorators/current-user.decorator.js';
import { ApiErrorResponses } from '../../decorators/api-error-responses.decorator.js';
import type { CurrentUser as CurrentUserData } from '../../interfaces/auth/current-user.interface.js';
import {
  subjectEnvelopeOpenApiSchema,
  subjectListEnvelopeOpenApiSchema,
} from './dto/subject-response.dto.js';
import {
  createSubjectSchema,
  type CreateSubjectDto,
} from './dto/create-subject.dto.js';
import { SubjectsService } from './subjects.service.js';

@ApiBearerAuth()
@Controller('subjects')
export class SubjectsController {
  constructor(private readonly subjects: SubjectsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ schema: subjectEnvelopeOpenApiSchema })
  @ApiErrorResponses(401, 422, 500)
  async create(
    @CurrentUser() user: CurrentUserData,
    @Body({ schema: createSubjectSchema }) input: CreateSubjectDto,
  ) {
    return { data: await this.subjects.create(user.id, input) };
  }

  @Get()
  @ApiOkResponse({ schema: subjectListEnvelopeOpenApiSchema })
  @ApiErrorResponses(401, 500)
  async list(@CurrentUser() user: CurrentUserData) {
    return { data: await this.subjects.list(user.id) };
  }
}
