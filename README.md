# pbusiness

## Learning platform setup

Roles: **admin** (creates teachers, assigns courses), **teacher** (adds video/written lessons, schedules live video classes, writes the exam, follows students), **student** (follows lessons, joins live classes, takes the exam, buys the certificate), **client**.

### Environment variables

```bash
# Supabase Storage — lesson videos/files. Create a PRIVATE bucket named "courses".
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_COURSE_BUCKET=courses        # optional

# Live classes (WebRTC) — optional TURN relay, strongly recommended in production
TURN_URLS=turn:turn.example.com:3478,turns:turn.example.com:5349
TURN_USERNAME=...
TURN_CREDENTIAL=...

NEXT_PUBLIC_APP_URL=https://www.p-bonline.dev   # certificate QR codes + Swychr callbacks (must be public https)

# Swychr (AccountPe) — payment collection
SWYCHR_API_KEY=...                    # Payment Gateway → API Key
SWYCHR_API_BASE=https://api.accountpe.com/api   # optional
SWYCHR_COUNTRIES=CM,CI,SN,...         # optional; checkout countries, each checked live
SWYCHR_PASS_DIGITAL_CHARGE=false      # true = customer pays Swychr's 2.5% digital charge
FX_USD_<CURRENCY>=...                 # fallback only; live rates are used when reachable
FX_MARKUP_PERCENT=0                   # optional margin on top of the live rate

# Teacher payouts
TEACHER_REVENUE_SHARE=0.7             # teacher's share of each course sale (default 0.7)
```

MongoDB and Gemini use the existing variables. PawaPay has been removed; its `PAWAPAY_*` variables can be deleted.

### Flows

- **Admin → Teachers** (`/dashboard/admin/teachers`): create teacher accounts and assign courses.
- **Teacher** (`/dashboard/teacher`): create courses, add lessons (video uploaded straight from the browser to Supabase, Markdown text, or a live WebRTC video class), track progress/attendance, edit the certification exam.
- **Student** (`/dashboard/student`): lessons at `/learn/<slug>`, live classes at `/live/<id>` (native WebRTC in the browser, attendance from 30s heartbeats), exam at `/learn/<slug>/exam` once progress reaches 100%.
- **Certification**: exam pass mark 70% (editable per course) → $49.99 paid via Swychr in the payer's local currency → LinkoPayroll PDF certificate with QR code, verifiable at `/certificates/<code>`.
- **AI Academy** (`/academy`): Twi, Ga, Ewe, French, English, Python, JavaScript, TypeScript, Java, SQL — $19 per module, taught by the Gemini tutor.

### Live classes (WebRTC)

- Native WebRTC, no third-party video service. Star topology: the teacher holds one connection per student; students receive the teacher's camera or shared screen and send their webcam to the teacher.
- Signaling (offers, answers, ICE candidates) goes over authenticated HTTP polling stored in MongoDB (`rtc_signals`, 10-min TTL), so it runs on serverless hosting without WebSockets.
- Without TURN, roughly 10–20% of users on strict mobile/corporate NATs cannot connect: set `TURN_*` (self-hosted coturn, or a provider such as Metered or Twilio).
- Practical size: about 15–25 students per class, limited by the teacher's upload bandwidth (video is capped at 900 kbps per student). Larger classes need an SFU (e.g. self-hosted LiveKit).

### Payments (Swychr)

- Checkout loads countries, mobile money methods, phone formats and currency live from Swychr; prices stay in USD on the server and are converted at the live market rate (open.er-api.com, cached 6 h, rounded up to a whole unit). `FX_USD_*` values are only a fallback when the feed is down; `FX_MARKUP_PERCENT` adds an optional margin. When `ACCOUNTPE_PASS_DIGITAL_CHARGE=true`, checkout shows Swychr's 2.5% charge and the exact total the phone will be asked for.
- Each payment gets its own secret callback URLs (success / failed). A callback is accepted only if its token matches the stored hash, then the course, certificate or AI module is unlocked. Account-level webhooks without a token are acknowledged and ignored.
- If a callback never arrives, **Admin → Payments & payouts** lists payments pending > 2 min; confirm them only after checking Swychr Transactions (transaction ID = reference).

### Teacher payouts

- Teachers earn `TEACHER_REVENUE_SHARE` of each sale of a course they teach (recorded at sale time). Certificates and AI modules go to the platform.
- Payout fee, deducted from the payout: **3.5% below $120, 2.6% from $120**. Minimum payout $10.
- Flow: teacher requests → admin approves → admin sends the net amount from the Swychr Payout Service and records its reference → paid. Requested payouts can be cancelled by the teacher; requested/approved ones can be rejected by the admin.

### Languages

UI: French, English, Twi (`tw`), Ga (`gaa`), Ewe (`ee`). Hand-written Ghanaian strings live in `lib/i18n/local-languages.ts`; missing keys fall back to English. Draft the rest with:

```bash
node --env-file=.env scripts/translate-locales.mjs
```

Have a native speaker review the Twi/Ga/Ewe strings before launch.
