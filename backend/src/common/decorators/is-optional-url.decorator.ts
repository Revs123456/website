import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsOptional, IsUrl, ValidationOptions } from 'class-validator';

/**
 * An optional URL field that actually behaves as optional when the client
 * sends an empty string, not just when the key is omitted entirely.
 *
 * Plain `@IsOptional() @IsUrl()` fails on '' — IsOptional() only skips
 * validation for `undefined`/`null`, so an empty string (which is exactly
 * what an untouched optional field in an HTML form submits) still reaches
 * IsUrl() and fails with "must be a URL address". Every optional URL field
 * in this codebase had this bug (jobs.apply_link, courses.course_link,
 * services image/link, resume-template links, order links, profile socials).
 */
export function IsOptionalUrl(
  urlOptions?: Parameters<typeof IsUrl>[0],
  validationOptions?: ValidationOptions,
) {
  return applyDecorators(
    Transform(({ value }) => (value === '' ? undefined : value)),
    IsOptional(),
    IsUrl(urlOptions, validationOptions),
  );
}
