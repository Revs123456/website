import { Body, Controller, Get, HttpCode, Param, Post, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { IsArray, ArrayMaxSize, ArrayMinSize, IsInt, Min, Max } from 'class-validator';
import { Request } from 'express';
import { QuizService } from './quiz.service';

class SubmitQuizDto {
  @IsArray()
  @ArrayMinSize(10)
  @ArrayMaxSize(10)
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(3, { each: true })
  answers: number[];
}

@Controller('quiz')
export class QuizController {
  constructor(private readonly svc: QuizService) {}

  @Get('questions')
  questions() {
    return { questions: this.svc.getQuestions() };
  }

  // Cheap call (no AI) but stores a row — light throttle to deter spam
  @Post('submit')
  @HttpCode(200)
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  async submit(@Body() dto: SubmitQuizDto, @Req() req: Request) {
    const userId = this.extractOptionalUserId(req);
    return this.svc.submit({ answers: dto.answers, userId });
  }

  @Get('result/:token')
  result(@Param('token') token: string) {
    return this.svc.getByToken(token);
  }

  private extractOptionalUserId(req: Request): string | null {
    try {
      const cookieToken = (req as any).cookies?.tch_user_token;
      if (!cookieToken) return null;
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const jwt = require('jsonwebtoken');
      const payload = jwt.verify(cookieToken, process.env.JWT_SECRET || '');
      return payload?.role === 'user' ? payload.sub : null;
    } catch {
      return null;
    }
  }
}
