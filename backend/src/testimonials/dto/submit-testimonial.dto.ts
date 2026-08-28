import { OmitType } from '@nestjs/mapped-types';
import { CreateTestimonialDto } from './create-testimonial.dto';

// Public, unauthenticated submission — deliberately omits `published` so an
// anonymous visitor can never publish their own testimonial straight to the
// homepage. The service always forces published: false regardless.
export class SubmitTestimonialDto extends OmitType(CreateTestimonialDto, ['published'] as const) {}
