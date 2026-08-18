/**
 * Server component for emitting structured data (JSON-LD) into the page <head>-level.
 *
 * Google reads this for rich results (job posting cards, person profiles, articles).
 * One small render = potentially huge organic traffic lift.
 *
 * Caller passes a fully-formed schema.org object. We escape `</script>` to
 * prevent JSON content from breaking out of the script tag (XSS defense
 * — copied from the existing org schema in app/layout.tsx).
 */
export default function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/<\/script>/gi, '<\\/script>'),
      }}
    />
  );
}
