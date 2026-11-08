import { Logger } from '@nestjs/common';

export class CustomLogger extends Logger {
  logRequest(payload: Record<string, unknown>): void {
    this.log(JSON.stringify(payload));
  }

  logResponse(payload: Record<string, unknown>): void {
    this.log(JSON.stringify(payload));
  }
}
