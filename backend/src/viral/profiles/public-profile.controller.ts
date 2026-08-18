import { Controller, Get, Param } from '@nestjs/common';
import { PublicProfileService } from './public-profile.service';

@Controller('users/public')
export class PublicProfileController {
  constructor(private readonly svc: PublicProfileService) {}

  /** Public — no auth. Mounted under /users/public so it's clear this is the public view. */
  @Get(':username')
  get(@Param('username') username: string) {
    return this.svc.getByUsername(username);
  }
}
