import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { Admin } from './entities/admin.entity';
import { JwtAuthGuard } from './guards/jwt.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Admin])],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard],
  exports: [JwtAuthGuard],
})
export class AuthModule {}
