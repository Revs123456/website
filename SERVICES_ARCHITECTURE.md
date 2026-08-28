<title>Dynamic Services Architecture — Design Proposal</title>

Last updated: 2026-08-28
Status: **Proposal — nothing implemented yet.** You asked for architecture guidance, not a build; this is that. Say the word and I'll implement it.

---

## 1. What exists today (and why it doesn't scale)

Inspected the real flows before proposing anything:

- **`Service`** ([schema.prisma](backend/prisma/schema.prisma)) is a flat catalog row: name, description, price, features, published. No concept of "what does buying this require."
- **The checkout flow** ([order/page.tsx](frontend/src/app/(public)/order/page.tsx)) is generic — name/email/phone/service selection/payment. No file upload, no slot picker. `service_type` is just set to the service's name for display.
- **Slot booking is a completely separate, disconnected system**: `/book` page + `Slot`/`Booking` models, unrelated to `Service`/`Order`. A "Web Development" service that needs scheduling has no way to plug into it today.
- **`Order.resume_file`** exists in the schema (I fixed its validator earlier this session) but **nothing anywhere populates it** — there's no upload UI, and more fundamentally:
- **No file storage exists in this codebase at all.** No S3, no MinIO, no upload endpoint. This was discussed earlier this session as future *deployment* infrastructure, but it was never actually wired into the application. Any "upload a resume" requirement needs this built first, regardless of how the service-config system is designed.
- **The admin service form** is 6 static fields — no way to declare requirements at all.

So today, every new "kind" of service would genuinely require a code change and a deploy — exactly what you want to avoid.

---

## 2. Proposed architecture: typed capabilities + JSON custom fields (not EAV)

Two ways people usually solve "admin-configurable form/workflow":

- **EAV** (`ServiceFieldValue(service_id, field_key, value)`, fully generic key-value) — maximally flexible, but painful to query/report on, weak typing, admin UI for viewing submissions gets awkward. Overkill for what you actually described.
- **Typed capability flags + a JSON schema for open-ended fields** — the two "heavy" requirement types you named (slot booking, file upload) get real, first-class treatment (because they need actual backend work — an upload endpoint, a scheduling integration — not just "show a form field"), and everything else ("some services may have completely different requirements... forms, additional info") goes through a small, generic field-definition schema. This is the same pattern Typeform/JotForm/Notion use internally, and it's the one I'd build.

### Schema changes

```prisma
model Service {
  id                String   @id @default(uuid()) @db.Uuid
  name              String
  description       String
  price             String
  included_features String
  image_url         String?
  is_popular        Boolean  @default(false)
  published         Boolean  @default(true)
  created_at        DateTime @default(now()) @db.Timestamptz
  updated_at        DateTime @default(now()) @updatedAt @db.Timestamptz

  // ── NEW: declared requirements, admin-editable, zero code changes to add a service ──
  requires_slot         Boolean @default(false)   // reuses the EXISTING Slot/Availability system
  requires_file_upload  Boolean @default(false)
  file_upload_label     String?                   // e.g. "Upload your resume (PDF, max 10MB)"
  custom_fields         Json    @default("[]")     // CustomFieldDef[] — the open-ended case

  requests ServiceRequest[]
}
```

```ts
// One shared type, frontend + backend
type CustomFieldDef = {
  key: string;                                            // stable id, e.g. "target_role"
  label: string;                                           // "What role are you targeting?"
  type: 'text' | 'textarea' | 'select' | 'checkbox' | 'date' | 'number';
  required: boolean;
  options?: string[];                                      // only for 'select'
  placeholder?: string;
};
```

`Order` becomes the universal service-request record (it already mostly is — this generalizes it rather than replacing it):

```prisma
model Order {
  // ...existing fields unchanged...
  slot_id             String?  @db.Uuid                    // NEW, set when service.requires_slot
  custom_field_values Json?                                 // NEW — { [key]: value }, matches service.custom_fields
  resume_file          String?                              // EXISTING field — becomes the generic
                                                              // "uploaded file URL" for *any* service that
                                                              // requires one, not resume-specific despite the name

  slot Slot? @relation(fields: [slot_id], references: [id])
}
```

**A necessary new piece**: a generic file-upload endpoint, since none exists. `POST /v1/uploads` (authenticated, size/type-limited) → stores to S3 (or, given your ₹2,500/month budget constraint from earlier this session, this is exactly the kind of small, cheap S3 usage that was already scoped for — a handful of PDFs, not a media platform) → returns a URL, which the frontend then submits as `resume_file`/a custom-field value. This is real, separate backend work, not just a schema addition — flagging it clearly rather than hand-waving "add a file input."

**Slot booking unification**: rather than building a second scheduling system, a service with `requires_slot=true` reuses the exact same `Slot`/availability admin UI that already powers `/book`. The standalone `Booking` model becomes redundant once this exists (its bookings could migrate to `Order` + `Slot`) — that's a real data migration, worth doing as a deliberate follow-up, not silently folded into this build.

### Admin panel UX
Add a "Requirements" section to the existing Add/Edit Service form:
- ☐ **Requires a scheduled slot** — reuses your existing Availability admin page, no new scheduling UI to build
- ☐ **Requires a file upload** → reveals a label text field ("What should we ask the user to upload?")
- **Custom fields** — a small repeatable builder: `[+ Add field]` → label, type dropdown (Text / Long text / Dropdown / Checkbox / Date / Number), required toggle, options (comma-separated, only for Dropdown)

Bounded, boring, buildable — not asking for arbitrary logic, just parameterizing a fixed set of known requirement types, which is what actually keeps "no code per new service" true without turning into an unmaintainable plugin-execution system.

### Public checkout flow (renders itself from the service's config)
1. Name/email/phone (as today).
2. `service.requires_slot` → embed the existing slot-picker inline.
3. `service.requires_file_upload` → file input, uploads via the new endpoint, stores the returned URL.
4. `service.custom_fields.map(...)` → render each field by `type`.
5. Submit → one `Order` create, `slot_id`/`resume_file`/`custom_field_values` populated as applicable. No per-service branching in this code — it's driven entirely by what the fetched `Service` record declares.

### Admin order-detail view
The Orders page (already improved earlier this session) needs a "view details" affordance per order: which slot was booked (if any, with a calendar/time display), a download link for the uploaded file (if any), and the custom-field answers rendered generically — label looked up from `service.custom_fields`, value from `order.custom_field_values[key]`. Entirely data-driven, same principle.

---

## 3. What this does and doesn't solve

**Solves**: any new service that needs some combination of {slot, file upload, N custom fields of the 6 supported types} — which covers all four examples you gave — configurable purely from the admin panel, no deploy.

**Doesn't solve** (and I'd say deliberately, not as an oversight): truly bespoke workflows — e.g. a service needing a multi-step wizard with conditional branching, or an entirely different payment model. If a future service needs something outside {slot, upload, simple fields}, that's a real new capability worth its own small, reviewed code change — the alternative (a config system expressive enough to encode arbitrary workflow logic) is a mini programming language you'd end up building and maintaining, which is a much bigger and riskier undertaking than "add one more field type" when the need actually arises.

---

## 4. Suggested build order, if you want this implemented

1. Schema migration (`Service` requirement columns + `custom_fields`, `Order.slot_id`/`custom_field_values`).
2. Generic upload endpoint + S3 wiring (net-new — nothing to extend).
3. Admin service form: Requirements section + custom-field builder.
4. Public checkout: dynamic rendering from `service.requires_slot`/`requires_file_upload`/`custom_fields`.
5. Admin order-detail view: slot/file/custom-field display.
6. (Separate, later) Migrate the standalone `Booking` flow onto `Order`+`Slot` so there's one request pipeline, not two.

Want me to start on this? If so — steps 1–5 in one pass, or would you rather see the schema + admin form first before I touch the public checkout page?
