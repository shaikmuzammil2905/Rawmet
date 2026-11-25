import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { Database } from "node-sqlite3-wasm";

type SqlValue = string | number | bigint | Uint8Array | null;

export interface PreparedStatement {
  run: (...params: unknown[]) => { changes: number; lastInsertRowid: number | bigint };
  get: (...params: unknown[]) => Record<string, unknown> | undefined;
  all: (...params: unknown[]) => Record<string, unknown>[];
}

export interface DbClient {
  exec: (sql: string) => void;
  prepare: (sql: string) => PreparedStatement;
}

declare global {
  // eslint-disable-next-line no-var
  var __rawmetDb: DbClient | undefined;
  // eslint-disable-next-line no-var
  var __rawmetRawDb: Database | undefined;
  // eslint-disable-next-line no-var
  var __rawmetSeeded: boolean | undefined;
}

function normalizeParams(params: unknown[]): SqlValue[] {
  return params.map((p) => {
    if (p === undefined || p === null) return null;
    if (typeof p === "boolean") return p ? 1 : 0;
    if (typeof p === "string" || typeof p === "number" || typeof p === "bigint" || p instanceof Uint8Array) {
      return p;
    }
    return String(p);
  });
}

function wrapWasmDb(rawDb: Database): DbClient {
  return {
    exec(sql: string) {
      rawDb.exec(sql);
    },
    prepare(sql: string): PreparedStatement {
      return {
        run(...params: unknown[]) {
          const stmt = rawDb.prepare(sql);
          try {
            const bound = normalizeParams(params);
            const res = bound.length > 0 ? stmt.run(bound) : stmt.run();
            return {
              changes: Number(res.changes ?? 0),
              lastInsertRowid: Number(res.lastInsertRowid ?? 0),
            };
          } finally {
            stmt.finalize();
          }
        },
        get(...params: unknown[]) {
          const stmt = rawDb.prepare(sql);
          try {
            const bound = normalizeParams(params);
            const row = bound.length > 0 ? stmt.get(bound) : stmt.get();
            return row ? { ...(row as Record<string, unknown>) } : undefined;
          } finally {
            stmt.finalize();
          }
        },
        all(...params: unknown[]) {
          const stmt = rawDb.prepare(sql);
          try {
            const bound = normalizeParams(params);
            const rows = bound.length > 0 ? stmt.all(bound) : stmt.all();
            return rows.map((r) => ({ ...(r as Record<string, unknown>) }));
          } finally {
            stmt.finalize();
          }
        },
      };
    },
  };
}

import { downloadDbFromS3, uploadDbToS3 } from "./s3";

let lastS3SyncMs = 0;

export async function syncDbFromS3(force = false): Promise<void> {
  const isReadOnlyEnv = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
  if (!isReadOnlyEnv) return;
  if (!force && Date.now() - lastS3SyncMs < 2000) return;
  try {
    const targetPath = resolveWritableDbPath();
    const downloaded = await downloadDbFromS3(targetPath);
    if (downloaded) {
      lastS3SyncMs = Date.now();
      if (globalThis.__rawmetRawDb) {
        try {
          globalThis.__rawmetRawDb.close();
        } catch {}
        globalThis.__rawmetRawDb = undefined;
      }
      globalThis.__rawmetDb = undefined;
    }
  } catch (err) {
    console.error("syncDbFromS3 error:", err);
  }
}

export async function syncDbToS3(): Promise<void> {
  try {
    const targetPath = resolveWritableDbPath();
    // Non-blocking upload with timeout protection
    Promise.race([
      uploadDbToS3(targetPath),
      new Promise<boolean>((_, reject) => setTimeout(() => reject(new Error("S3 sync timeout")), 4000)),
    ])
      .then((uploaded) => {
        if (uploaded) lastS3SyncMs = Date.now();
      })
      .catch((err) => {
        console.error("syncDbToS3 non-blocking error:", err);
      });
  } catch (err) {
    console.error("syncDbToS3 error:", err);
  }
}

function resolveWritableDbPath(): string {
  const isReadOnlyEnv = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
  const candidateDir = isReadOnlyEnv ? path.join(os.tmpdir(), "rawmet-data") : path.join(process.cwd(), "data");
  try {
    if (!fs.existsSync(candidateDir)) {
      fs.mkdirSync(candidateDir, { recursive: true });
    }
    const dbFile = path.join(candidateDir, "rawmet.db");
    if (isReadOnlyEnv && !fs.existsSync(dbFile)) {
      const sourceDb = path.join(process.cwd(), "data", "rawmet.db");
      if (fs.existsSync(sourceDb)) {
        try {
          fs.copyFileSync(sourceDb, dbFile);
        } catch {}
      }
    }
    // Clean stale lock folder if an invocation exited unexpectedly
    const lockDir = `${dbFile}.lock`;
    if (fs.existsSync(lockDir)) {
      try {
        fs.rmSync(lockDir, { recursive: true, force: true });
      } catch {}
    }
    return dbFile;
  } catch {
    return ":memory:";
  }
}

function initializeSchema(db: DbClient): void {
  db.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      mobile TEXT NOT NULL UNIQUE,
      whatsapp TEXT DEFAULT '',
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin','vendor','customer')) DEFAULT 'customer',
      status TEXT NOT NULL CHECK(status IN ('active','suspended')) DEFAULT 'active',
      otp_code TEXT DEFAULT '',
      otp_expires_at TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS vendors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      business_name TEXT NOT NULL,
      owner_name TEXT NOT NULL,
      mobile TEXT NOT NULL,
      whatsapp TEXT NOT NULL,
      email TEXT NOT NULL,
      business_category TEXT NOT NULL,
      product_service_category TEXT NOT NULL,
      gst_number TEXT NOT NULL,
      id_proof_type TEXT NOT NULL DEFAULT 'GST Certificate',
      id_proof_url TEXT DEFAULT '',
      logo_url TEXT DEFAULT '/images/rawmet-logo.png',
      address TEXT NOT NULL,
      city TEXT NOT NULL DEFAULT '',
      state TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      product_details TEXT NOT NULL DEFAULT '',
      verification_status TEXT NOT NULL CHECK(verification_status IN ('pending','approved','rejected','suspended')) DEFAULT 'pending',
      whatsapp_opt_in INTEGER NOT NULL DEFAULT 1,
      whatsapp_categories TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL CHECK(type IN ('product','machinery','service')),
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL DEFAULT '',
      image_url TEXT NOT NULL DEFAULT '/images/cat-products.png',
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS subcategories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS listings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vendor_id INTEGER NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
      type TEXT NOT NULL CHECK(type IN ('product','machinery','service')),
      category_slug TEXT NOT NULL,
      subcategory_slug TEXT NOT NULL DEFAULT '',
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      short_description TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      specifications TEXT NOT NULL DEFAULT '{}',
      location TEXT NOT NULL DEFAULT '',
      price_display TEXT NOT NULL DEFAULT 'Request Quote',
      availability TEXT NOT NULL DEFAULT 'In Stock',
      image_url TEXT NOT NULL DEFAULT '/images/cat-products.png',
      gallery_urls TEXT NOT NULL DEFAULT '[]',
      status TEXT NOT NULL CHECK(status IN ('pending','approved','rejected')) DEFAULT 'pending',
      featured INTEGER NOT NULL DEFAULT 0,
      views_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS requirements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      name TEXT NOT NULL,
      business_name TEXT NOT NULL DEFAULT '',
      mobile TEXT NOT NULL,
      whatsapp TEXT NOT NULL,
      email TEXT NOT NULL DEFAULT '',
      category_type TEXT NOT NULL CHECK(category_type IN ('product','machinery','service')) DEFAULT 'product',
      category_slug TEXT NOT NULL,
      title TEXT NOT NULL,
      quantity TEXT NOT NULL DEFAULT '',
      location TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      attachment_url TEXT DEFAULT '',
      status TEXT NOT NULL CHECK(status IN ('open','matched','closed')) DEFAULT 'open',
      matched_vendors_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS enquiries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      listing_id INTEGER REFERENCES listings(id) ON DELETE SET NULL,
      vendor_id INTEGER REFERENCES vendors(id) ON DELETE SET NULL,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      name TEXT NOT NULL,
      business_name TEXT NOT NULL DEFAULT '',
      mobile TEXT NOT NULL,
      email TEXT NOT NULL DEFAULT '',
      message TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('new','contacted','closed')) DEFAULT 'new',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS saved_listings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      listing_id INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, listing_id)
    );

    CREATE TABLE IF NOT EXISTS subscription_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      duration_months INTEGER NOT NULL,
      bonus_months INTEGER NOT NULL DEFAULT 0,
      price_inr INTEGER NOT NULL,
      gst_included INTEGER NOT NULL DEFAULT 1,
      badge_text TEXT NOT NULL DEFAULT '',
      highlight_text TEXT NOT NULL DEFAULT '',
      features TEXT NOT NULL DEFAULT '[]',
      is_active INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT NOT NULL UNIQUE,
      payment_id TEXT DEFAULT '',
      signature TEXT DEFAULT '',
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      plan_id INTEGER NOT NULL REFERENCES subscription_plans(id),
      amount_inr INTEGER NOT NULL,
      gst_amount_inr INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL CHECK(status IN ('created','pending','paid','failed','cancelled')) DEFAULT 'created',
      payment_method TEXT DEFAULT 'UPI / Card / NetBanking',
      invoice_number TEXT DEFAULT '',
      failure_reason TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      verified_at TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS user_subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      plan_id INTEGER NOT NULL REFERENCES subscription_plans(id),
      payment_id INTEGER NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
      status TEXT NOT NULL CHECK(status IN ('active','expired','cancelled')) DEFAULT 'active',
      starts_at TEXT NOT NULL,
      ends_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS whatsapp_notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      requirement_id INTEGER REFERENCES requirements(id) ON DELETE CASCADE,
      vendor_id INTEGER REFERENCES vendors(id) ON DELETE CASCADE,
      vendor_name TEXT NOT NULL,
      vendor_whatsapp TEXT NOT NULL,
      category_slug TEXT NOT NULL,
      message_preview TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('queued','sent','skipped')) DEFAULT 'sent',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS referrals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      mobile TEXT NOT NULL,
      whatsapp TEXT NOT NULL,
      location TEXT NOT NULL,
      reference_details TEXT NOT NULL,
      referral_code TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('new','approved','rewarded')) DEFAULT 'new',
      reward_note TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS gallery_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      image_url TEXT NOT NULL,
      caption TEXT NOT NULL DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS site_content (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS subscription_forms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      user_type TEXT NOT NULL DEFAULT 'seller',
      name TEXT NOT NULL,
      business_name TEXT NOT NULL DEFAULT '',
      mobile TEXT NOT NULL,
      email TEXT NOT NULL DEFAULT '',
      plan_name TEXT NOT NULL DEFAULT 'Subscription Form (₹1,500)',
      amount_inr INTEGER NOT NULL DEFAULT 1500,
      notes TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL CHECK(status IN ('pending','approved','rejected','converted')) DEFAULT 'pending',
      admin_remarks TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      user_email TEXT NOT NULL DEFAULT '',
      action TEXT NOT NULL,
      details TEXT NOT NULL DEFAULT '',
      ip_address TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  runSafeMigrations(db);
}

function runSafeMigrations(db: DbClient): void {
  const migrations = [
    "ALTER TABLE subscription_plans ADD COLUMN user_type TEXT NOT NULL DEFAULT 'all'",
    "ALTER TABLE subscription_plans ADD COLUMN listing_allowance INTEGER NOT NULL DEFAULT -1",
    "ALTER TABLE subscription_plans ADD COLUMN contact_unlock_allowance INTEGER NOT NULL DEFAULT -1",
    "ALTER TABLE subscription_plans ADD COLUMN enquiry_allowance INTEGER NOT NULL DEFAULT -1",
    "ALTER TABLE subscription_plans ADD COLUMN description TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE listings ADD COLUMN rejection_reason TEXT DEFAULT ''",
    "ALTER TABLE listings ADD COLUMN is_published INTEGER NOT NULL DEFAULT 1",
    "ALTER TABLE vendors ADD COLUMN rejection_reason TEXT DEFAULT ''",
    "ALTER TABLE users ADD COLUMN rejection_reason TEXT DEFAULT ''",
    "ALTER TABLE users ADD COLUMN last_login_at TEXT DEFAULT ''",
    "ALTER TABLE listings ADD COLUMN master_product_id INTEGER DEFAULT NULL",
    "ALTER TABLE listings ADD COLUMN price_numeric REAL DEFAULT 0",
    "ALTER TABLE listings ADD COLUMN price_unit TEXT DEFAULT 'Kg'",
    "ALTER TABLE listings ADD COLUMN min_order_qty TEXT DEFAULT '1'",
    "ALTER TABLE listings ADD COLUMN supply_location TEXT DEFAULT ''",
    "ALTER TABLE listings ADD COLUMN commercial_details TEXT DEFAULT ''",
    "ALTER TABLE listings ADD COLUMN is_master INTEGER DEFAULT 0",
    "ALTER TABLE vendors ADD COLUMN business_type TEXT DEFAULT 'Manufacturer & Bulk Supplier'",
  ];
  for (const sql of migrations) {
    try {
      db.exec(sql);
    } catch {
      // Column already present
    }
  }
}

export function getDb(): DbClient {
  if (!globalThis.__rawmetDb) {
    const dbPath = resolveWritableDbPath();
    let rawDb: Database | null = null;
    const lockDir = `${dbPath}.lock`;

    for (let attempt = 1; attempt <= 5; attempt++) {
      try {
        if (fs.existsSync(lockDir)) {
          try {
            fs.rmSync(lockDir, { recursive: true, force: true });
          } catch {}
        }
        rawDb = new Database(dbPath);
        try {
          rawDb.exec("PRAGMA busy_timeout = 30000;");
        } catch {}
        break;
      } catch (err) {
        if (attempt === 5) {
          console.error(`Failed to open SQLite database after 5 attempts at ${dbPath}:`, err);
          rawDb = new Database(":memory:");
        } else {
          // Clean stale lock before retry
          try {
            fs.rmSync(lockDir, { recursive: true, force: true });
          } catch {}
        }
      }
    }

    if (!rawDb) {
      rawDb = new Database(":memory:");
    }

    globalThis.__rawmetRawDb = rawDb;
    const client = wrapWasmDb(rawDb);
    initializeSchema(client);
    globalThis.__rawmetDb = client;
  }
  return globalThis.__rawmetDb;
}
