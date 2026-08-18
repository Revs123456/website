import { UseGuards, Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { BlogsService } from './blogs.service';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';

@Controller('blogs')
export class BlogsController {
  constructor(private readonly blogsService: BlogsService) {}

  @UseGuards(JwtAuthGuard)
  @Post() create(@Body() dto: CreateBlogDto) { return this.blogsService.create(dto); }

  // Admin only — returns all blogs including drafts
  @UseGuards(JwtAuthGuard)
  @Get() findAll(@Query('page') page?: string, @Query('limit') limit?: string) { return this.blogsService.findAll(page ? +page : 1, limit ? +limit : undefined); }

  @Get('published') findPublished(@Query('page') page?: string, @Query('limit') limit?: string) { return this.blogsService.findPublished(page ? +page : 1, limit ? +limit : undefined); }

  @Get(':id') findOne(@Param('id') id: string) { return this.blogsService.findOne(id); }

  @UseGuards(JwtAuthGuard)
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateBlogDto) { return this.blogsService.update(id, dto); }

  @UseGuards(JwtAuthGuard)
  @Delete(':id') remove(@Param('id') id: string) { return this.blogsService.remove(id); }
}
