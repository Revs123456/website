import { UseGuards, Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { BlogsService } from './blogs.service';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';

@Controller('blogs')
export class BlogsController {
  constructor(private readonly blogsService: BlogsService) {}

  @UseGuards(JwtAuthGuard)
  @Post() create(@Body() dto: CreateBlogDto) { return this.blogsService.create(dto); }

  @Get() findAll() { return this.blogsService.findAll(); }

  @Get('published') findPublished() { return this.blogsService.findPublished(); }

  @Get(':id') findOne(@Param('id') id: string) { return this.blogsService.findOne(id); }

  @UseGuards(JwtAuthGuard)
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateBlogDto) { return this.blogsService.update(id, dto); }

  @UseGuards(JwtAuthGuard)
  @Delete(':id') remove(@Param('id') id: string) { return this.blogsService.remove(id); }
}
