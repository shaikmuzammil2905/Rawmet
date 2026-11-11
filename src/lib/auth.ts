import crypto from "node:crypto";
import { cookies } from "next/headers";
import type { UserRecord, UserRole } from "./types";

const SESSION_COOKIE_NAME = "rawmet_session";

function getAuthSecret(): string {
  return process.env.AUTH_SECRET || "rawmet_fallback_dev_secret_key_change_me";
}

function getPaymentSecret(): string {
  return process.env.PAYMENT_GATEWAY_SECRET || "rawmet_payment_fallback_secret_change_me";
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash || !storedHash.includes(":")) return false;
  const [salt, keyHex] = storedHash.split(":");
  if (!salt || !keyHex) return false;
  const derived = crypto.scryptSync(password, salt, 64);
  const storedBuf = Buffer.from(keyHex, "hex");
  if (derived.length !== storedBuf.length) return false;
  return crypto.timingSafeEqual(derived, storedBuf);
}

interface SessionPayload {
  uid: number;
  role: UserRole;
  exp: number;
}

export function signSessionToken(uid: number, role: UserRole, ttlSeconds = 60 * 60 * 24 * 7): string {
  const payload: SessionPayload = {
    uid,
    role,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const sig = crypto
    .createHmac("sha256", getAuthSecret())
    .update(encoded)
    .digest("base64url");
  return `${encoded}.${sig}`;
}

export function verifySessionToken(token: string | undefined | null): SessionPayload | null {
  if (!token || !token.includes(".")) return null;
  const [encoded, sig] = token.split(".");
  if (!encoded || !sig) return null;
  const expectedSig = crypto
    .createHmac("sha256", getAuthSecret())
    .update(encoded)
    .digest("base64url");
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  try {
    const parsed = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as SessionPayload;
    if (!parsed.uid || !parsed.role || !parsed.exp) return null;
    if (parsed.exp < Math.floor(Date.now() / 1000)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function signPaymentOrderToken(orderId: string, userId: number, planId: number, amountInr: number): string {
  return crypto
    .createHmac("sha256", getPaymentSecret())
    .update(`${orderId}|${userId}|${planId}|${amountInr}`)
    .digest("hex");
}

export function verifyPaymentOrderToken(
  token: string,
  orderId: string,
  userId: number,
  planId: number,
  amountInr: number
): boolean {
  const expected = signPaymentOrderToken(orderId, userId, planId, amountInr);
  const a = Buffer.from(token || "", "utf8");
  const b = Buffer.from(expected, "utf8");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function setSessionCookie(uid: number, role: UserRole): Promise<void> {
  const token = signSessionToken(uid, role);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: Boolean(
      process.env.NODE_ENV === "production" && process.env.NEXT_PUBLIC_SITE_URL?.startsWith("https://")
    ),
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getSessionPayload(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return verifySessionToken(token);
}

export function sanitizeUser(row: Record<string, unknown>): UserRecord {
  return {
    id: Number(row.id),
    name: String(row.name),
    email: String(row.email),
    mobile: String(row.mobile),
    whatsapp: String(row.whatsapp || row.mobile),
    role: row.role as UserRole,
    status: (row.status as "active" | "suspended") || "active",
    created_at: String(row.created_at),
  };
}

