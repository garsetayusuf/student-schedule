import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service.js';
import type { CreateSubjectDto } from './dto/create-subject.dto.js';

@Injectable()
export class SubjectsService {
  constructor(private readonly prisma: PrismaService) {}

  create(userId: string, input: CreateSubjectDto) {
    return this.prisma.subject.create({ data: { userId, ...input } });
  }

  list(userId: string) {
    return this.prisma.subject.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });
  }
}
