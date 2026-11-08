import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../../decorators/current-user.decorator.js';
import { ApiErrorResponses } from '../../decorators/api-error-responses.decorator.js';
import type { CurrentUser as CurrentUserData } from '../../interfaces/auth/current-user.interface.js';
import {
  createEventSchema,
  type CreateEventDto,
} from './dto/create-event.dto.js';
import {
  eventEnvelopeOpenApiSchema,
  eventListEnvelopeOpenApiSchema,
} from './dto/event-response.dto.js';
import { listEventsSchema, type ListEventsDto } from './dto/list-events.dto.js';
import { patchEventSchema, type PatchEventDto } from './dto/patch-event.dto.js';
import { EventsService } from './events.service.js';

@ApiBearerAuth()
@Controller('events')
export class EventsController {
  constructor(private readonly events: EventsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ schema: eventEnvelopeOpenApiSchema })
  @ApiErrorResponses(401, 422, 500)
  async create(
    @CurrentUser() user: CurrentUserData,
    @Body({ schema: createEventSchema }) input: CreateEventDto,
  ) {
    return { data: await this.events.create(user.id, input) };
  }

  @Get()
  @ApiOkResponse({ schema: eventListEnvelopeOpenApiSchema })
  @ApiErrorResponses(401, 422, 500)
  async list(
    @CurrentUser() user: CurrentUserData,
    @Query({ schema: listEventsSchema }) range: ListEventsDto,
  ) {
    return {
      data: await this.events.list(
        user.id,
        range.from,
        range.to,
        user.timeZone,
      ),
    };
  }

  @Get(':id')
  @ApiOkResponse({ schema: eventEnvelopeOpenApiSchema })
  @ApiErrorResponses(401, 404, 500)
  async one(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
    return { data: await this.events.one(user.id, id) };
  }

  @Patch(':id')
  @ApiOkResponse({ schema: eventEnvelopeOpenApiSchema })
  @ApiErrorResponses(401, 404, 422, 500)
  async update(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body({ schema: patchEventSchema }) input: PatchEventDto,
  ) {
    return { data: await this.events.update(user.id, id, input) };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  @ApiErrorResponses(401, 404, 500)
  async remove(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ): Promise<void> {
    await this.events.remove(user.id, id);
  }
}
