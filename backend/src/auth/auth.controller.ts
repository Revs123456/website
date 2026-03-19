import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('admins')
  listAdmins() {
    return this.authService.listAdmins();
  }

  @Post('create-admin')
  createAdmin(@Body() body: { email: string; password: string }) {
    return this.authService.createAdmin(body.email, body.password);
  }

  @Delete('admins/:id')
  deleteAdmin(@Param('id') id: string) {
    return this.authService.deleteAdmin(id);
  }
}
