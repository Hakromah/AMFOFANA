/**
 * Seed script — Certificate Types & Mentions for AMFOFANA
 * Usage: node seed_certificates.js
 */

const { Client } = require('pg');

const client = new Client({
  host:     '127.0.0.1',
  port:     5432,
  database: 'amf_strapi',
  user:     'postgres',
  password: 'postgres18',
});

// ─── 7 Certificate Types ──────────────────────────────────────────────────────
const CERT_TYPES = [
  {
    name:             "High School Graduation Diploma",
    is_graduation:    true,
    default_programme:"Secondary High School Academic Cycle — Official Graduation",
    display_order:    1,
  },
  {
    name:             'Certificate of Academic Excellence',
    is_graduation:    true,
    default_programme:'Outstanding Academic Performance and Examination Success',
    display_order:    2,
  },
  {
    name:             'Certificate of School Enrollment',
    is_graduation:    false,
    default_programme:'Regular Schooling and Enrollment — Current Academic Year',
    display_order:    3,
  },
  {
    name:             'Certificate of Attendance',
    is_graduation:    false,
    default_programme:'Regular Attendance and Diligence in Classes',
    display_order:    4,
  },
  {
    name:             'Letter of Good Conduct',
    is_graduation:    false,
    default_programme:'Exemplary Behavior and Civic Discipline throughout Academic Term',
    display_order:    5,
  },
  {
    name:             'Character Certificate',
    is_graduation:    false,
    default_programme:'High Moral Character and Compliance with School Regulations',
    display_order:    6,
  },
  {
    name:             'Letter of Recommendation',
    is_graduation:    false,
    default_programme:'Academic Excellence, Leadership, and Personal Integrity',
    display_order:    7,
  },
];

// ─── Mentions / Honors ────────────────────────────────────────────────────────
const MENTIONS = [
  { name: 'Summa Cum Laude (Highest Honors)', min_average: 18, display_order: 1 },
  { name: 'Magna Cum Laude (High Honors)',    min_average: 16, display_order: 2 },
  { name: 'Cum Laude (Honors)',               min_average: 14, display_order: 3 },
  { name: 'With Merit',                       min_average: 12, display_order: 4 },
  { name: 'Pass',                             min_average: 10, display_order: 5 },
];

async function seed() {
  await client.connect();
  console.log('Connected to database: amf_strapi\n');

  // ── Ensure tables exist or create them if Strapi hasn't restarted yet ──
  await client.query(`
    CREATE TABLE IF NOT EXISTS certificate_types (
      id SERIAL PRIMARY KEY,
      document_id VARCHAR(255),
      name VARCHAR(255) UNIQUE NOT NULL,
      is_graduation BOOLEAN DEFAULT false,
      default_programme TEXT,
      display_order INTEGER DEFAULT 0,
      created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
      published_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
      created_by_id INTEGER,
      updated_by_id INTEGER,
      locale VARCHAR(255)
    );

    CREATE TABLE IF NOT EXISTS certificate_mentions (
      id SERIAL PRIMARY KEY,
      document_id VARCHAR(255),
      name VARCHAR(255) UNIQUE NOT NULL,
      min_average NUMERIC,
      display_order INTEGER DEFAULT 0,
      created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
      published_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
      created_by_id INTEGER,
      updated_by_id INTEGER,
      locale VARCHAR(255)
    );

    CREATE TABLE IF NOT EXISTS certificates (
      id SERIAL PRIMARY KEY,
      document_id VARCHAR(255),
      serial_number VARCHAR(255) UNIQUE,
      student_name VARCHAR(255),
      student_user_id VARCHAR(255),
      certificate_type VARCHAR(255),
      programme TEXT,
      issue_date VARCHAR(255),
      verification_hash VARCHAR(255) UNIQUE,
      cert_status VARCHAR(255) DEFAULT 'Valide',
      mention VARCHAR(255),
      gpa NUMERIC,
      max_gpa NUMERIC,
      total_credits INTEGER,
      class_rank VARCHAR(255),
      class_name VARCHAR(255),
      issued_by_role VARCHAR(255),
      note TEXT,
      created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
      published_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
      created_by_id INTEGER,
      updated_by_id INTEGER,
      locale VARCHAR(255)
    );

    CREATE TABLE IF NOT EXISTS certificates_recipient_user_lnk (
      id SERIAL PRIMARY KEY,
      certificate_id INTEGER,
      user_id INTEGER,
      certificate_order NUMERIC,
      user_order NUMERIC
    );
  `);

  // ── Seed Certificate Types ────────────────────────────────────────────────
  console.log('\n── Seeding Certificate Types ──────────────────────────────────');
  let typesInserted = 0, typesSkipped = 0;

  for (const t of CERT_TYPES) {
    const exists = await client.query(
      'SELECT id FROM certificate_types WHERE name = $1',
      [t.name]
    );
    if (exists.rows.length > 0) {
      console.log(`  ⊙ Skipped (exists): ${t.name}`);
      typesSkipped++;
      continue;
    }

    await client.query(`
      INSERT INTO certificate_types
        (name, is_graduation, default_programme, display_order, created_at, updated_at, published_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW(), NOW())
    `, [t.name, t.is_graduation, t.default_programme, t.display_order]);
    console.log(`  ✔ Inserted: ${t.is_graduation ? '🎓' : '📄'} ${t.name}`);
    typesInserted++;
  }
  console.log(`  → ${typesInserted} inserted, ${typesSkipped} skipped\n`);

  // ── Seed Mentions ─────────────────────────────────────────────────────────
  console.log('── Seeding Certificate Mentions ────────────────────────────────');
  let mentInserted = 0, mentSkipped = 0;

  for (const m of MENTIONS) {
    const exists = await client.query(
      'SELECT id FROM certificate_mentions WHERE name = $1',
      [m.name]
    );
    if (exists.rows.length > 0) {
      console.log(`  ⊙ Skipped (exists): ${m.name}`);
      mentSkipped++;
      continue;
    }

    await client.query(`
      INSERT INTO certificate_mentions
        (name, min_average, display_order, created_at, updated_at, published_at)
      VALUES ($1, $2, $3, NOW(), NOW(), NOW())
    `, [m.name, m.min_average, m.display_order]);
    console.log(`  ✔ Inserted: ${m.name} (min: ${m.min_average})`);
    mentInserted++;
  }
  console.log(`  → ${mentInserted} inserted, ${mentSkipped} skipped\n`);

  // ── Summary ───────────────────────────────────────────────────────────────
  const typesCount = await client.query('SELECT COUNT(*) FROM certificate_types');
  const mentCount  = await client.query('SELECT COUNT(*) FROM certificate_mentions');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`✅ Done! Types: ${typesCount.rows[0].count}  |  Mentions: ${mentCount.rows[0].count}`);
  console.log('   The dropdowns in the Certificates page will now be populated from Strapi.');
  console.log('   You can edit or add more via Strapi Admin → Content-Manager.');

  await client.end();
}

seed().catch(err => {
  console.error('\n❌ Seed failed:', err.message);
  client.end();
  process.exit(1);
});
