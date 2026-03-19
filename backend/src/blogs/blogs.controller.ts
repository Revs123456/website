import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { BlogsService } from './blogs.service';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';

@Controller('blogs')
export class BlogsController {
  constructor(private readonly blogsService: BlogsService) {}

  @Post() create(@Body() dto: CreateBlogDto) { return this.blogsService.create(dto); }

  @Get() findAll() { return this.blogsService.findAll(); }

  @Get(':id') findOne(@Param('id') id: string) { return this.blogsService.findOne(id); }

  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateBlogDto) { return this.blogsService.update(id, dto); }

  @Delete(':id') remove(@Param('id') id: string) { return this.blogsService.remove(id); }
}
