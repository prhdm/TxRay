import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SiweMessage } from "https://esm.sh/siwe@2";
import { create as createJWT } from "https://deno.land/x/djwt@v2.8/mod.ts";
import { TelegramBot, safeTelegramAlert } from "../_shared/telegram.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_KEY = Deno.env.get("SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const JWT_SECRET = Deno.env.get("JWT_SECRET") ?? "";
const APP_ORIGIN = Deno.env.get("APP_ORIGIN") ?? "http://localhost:3000";

const CHAIN_ID = 167009;
const NONCE_TTL_MIN = 10;
const ACCESS_TTL_MIN = 15;
const REFRESH_MAX_DAYS = 30;
const REFRESH_STEP_DAYS = 7;

const sb = createClient(SUPABASE_URL, SERVICE_KEY);
const enc = new TextEncoder();
let _jwtKeyPromise = null;
function getJwtKey() {
  const secret = JWT_SECRET;
  if (!secret) throw new Error("Missing JWT_SECRET");
  if (!_jwtKeyPromise) {
    _jwtKeyPromise = crypto.subtle.importKey("raw", enc.encode(secret), {
      name: "HMAC",
      hash: "SHA-256"
    }, false, [
      "sign",
      "verify"
    ]);
  }
  return _jwtKeyPromise;
}
const ORIGIN_HOST = new URL(APP_ORIGIN).hostname;
const allowHeaders = "Content-Type, Authorization, X-CSRF-Token";
function cors(origin) {
  const ok = !!origin && origin === APP_ORIGIN;
  return {
    ...ok ? {
      "Access-Control-Allow-Origin": APP_ORIGIN,
      "Access-Control-Allow-Credentials": "true"
    } : {},
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": allowHeaders,
    "Vary": "Origin"
  };
}
function json(status, body, origin, extra = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...cors(origin),
      ...extra
    }
  });
}
function bad(msg, origin, code = 400) {
  return json(code, {
    error: msg
  }, origin);
}
function randHex(bytes = 32) {
  const b = new Uint8Array(bytes);
  crypto.getRandomValues(b);
  return [
    ...b
  ].map((x)=>x.toString(16).padStart(2, "0")).join("");
}
async function sha256Hex(s) {
  const d = await crypto.subtle.digest("SHA-256", enc.encode(s));
  return [
    ...new Uint8Array(d)
  ].map((b)=>b.toString(16).padStart(2, "0")).join("");
}
function getCookie(req, key) {
  const m = req.headers.get("cookie")?.match(new RegExp(`${key}=([^;]+)`));
  return m?.[1];
}
function setCookie(res, name, value, opts = {}) {
  const parts = [
    `${name}=${value}`,
    "Path=/",
    "Secure",
    "SameSite=None"
  ];
  if (opts.httpOnly) parts.push("HttpOnly");
  if (opts.maxAge !== undefined) parts.push(`Max-Age=${opts.maxAge}`);
  res.headers.append("Set-Cookie", parts.join("; "));
  return res;
}
function clearCookie(res, name) {
  res.headers.append("Set-Cookie", `${name}=; Path=/; Secure; SameSite=None; HttpOnly; Max-Age=0`);
  return res;
}
function requireCsrf(req, origin) {
  const cookie = getCookie(req, "__Host-csrf");
  const header = req.headers.get("x-csrf-token");
  if (!cookie || !header || cookie !== header) return "CSRF token invalid";
  if (origin && origin !== APP_ORIGIN) return "Origin mismatch";
  return null;
}
function clientIp(req) {
  const raw = req.headers.get("CF-Connecting-IP") || req.headers.get("X-Forwarded-For") || req.headers.get("x-real-ip");
  return raw?.split(",")[0]?.trim() || null;
}
function getPath(req) {
  const p = new URL(req.url).pathname;
  const i = p.lastIndexOf("/auth");
  return i >= 0 ? p.slice(i + "/auth".length) || "/" : p;
}
async function signAccessJWT(userId, wallet) {
  const jwtKey = await getJwtKey();
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: userId,
    aud: "authenticated",
    role: "authenticated",
    wallet_address: wallet,
    email: `${wallet}@wallet.local`,
    iat: now,
    exp: now + ACCESS_TTL_MIN * 60
  };
  return await createJWT({
    alg: "HS256",
    typ: "JWT"
  }, payload, jwtKey);
}
async function createOrFindUserByEmail(email, wallet_address) {
  const admin = sb.auth.admin;
  const created = await admin.createUser({
    email,
    email_confirm: true,
    user_metadata: {
      wallet_address
    }
  });
  if (!created.error && created.data?.user) return created.data.user;
  if (created.error && !/already|exists|registered/i.test(created.error.message)) {
    throw created.error;
  }
  let page = 1;
  const perPage = 1000;
  for(;;){
    const { data, error } = await admin.listUsers({
      page,
      perPage
    });
    if (error) throw error;
    const found = data?.users?.find((u)=>(u.email || "").toLowerCase() === email.toLowerCase());
    if (found) return found;
    if (!data || !data.users || data.users.length < perPage) break;
    page += 1;
  }
  throw new Error("User exists but could not be retrieved via listUsers");
}

async function handleCsrf(_req, origin) {
  const token = randHex(32);
  const res = json(200, {
    csrf: token
  }, origin);
  res.headers.append("Set-Cookie", `__Host-csrf=${token}; Path=/; Secure; SameSite=None; Max-Age=${REFRESH_MAX_DAYS * 86400}`);
  return res;
}
async function handleNonce(req, origin) {
  const csrfErr = requireCsrf(req, origin);
  if (csrfErr) return bad(csrfErr, origin, 403);
  const { address } = await req.json().catch(()=>({}));
  if (!address) return bad("Address required", origin);
  const nonce = randHex(32);
  const exp = new Date(Date.now() + NONCE_TTL_MIN * 60_000).toISOString();
  const { error } = await sb.from("siwe_nonces").upsert({
    address: address.toLowerCase(),
    nonce,
    expires_at: exp,
    used: false,
    used_at: null
  });
  if (error) return bad("Failed to persist nonce", origin, 500);
  return json(200, {
    nonce
  }, origin);
}
async function handleSiweVerify(req, origin) {
  const csrfErr = requireCsrf(req, origin);
  if (csrfErr) return bad(csrfErr, origin, 403);
  const { address, message, signature } = await req.json().catch(()=>({}));
  if (!address || !message || !signature) return bad("Missing required fields", origin);
  const lower = address.toLowerCase();
  const { data: nrow, error: nerr } = await sb.from("siwe_nonces").select("nonce,expires_at,used").eq("address", lower).single();
  if (nerr || !nrow) return bad("Nonce not found", origin);
  const siwe = new SiweMessage(message);
  try {
    await siwe.verify({
      signature,
      domain: ORIGIN_HOST,
      nonce: nrow.nonce,
      time: new Date().toISOString()
    });
  } catch  {
    return bad("Invalid SIWE message/signature", origin, 400);
  }
  if (siwe.address.toLowerCase() !== lower) return bad("Address mismatch", origin);
  if (Number(siwe.chainId) !== CHAIN_ID) return bad("Wrong chain", origin);
  if (siwe.domain !== ORIGIN_HOST) return bad("Invalid domain", origin);
  if (siwe.uri && new URL(siwe.uri).origin !== APP_ORIGIN) return bad("Invalid uri", origin);
  if (nrow.used || new Date(nrow.expires_at) < new Date()) return bad("Nonce used/expired", origin);
  if (siwe.expirationTime && new Date(siwe.expirationTime) < new Date()) return bad("SIWE expired", origin);
  if (siwe.notBefore && new Date(siwe.notBefore) > new Date()) return bad("SIWE not active yet", origin);
  const { error: uerr } = await sb.from("siwe_nonces").update({
    used: true,
    used_at: new Date().toISOString()
  }).eq("address", lower).eq("nonce", siwe.nonce);
  if (uerr) return bad("Failed to consume nonce", origin, 500);
  const email = `${lower}@wallet.local`;
  let authUser;
  try {
    authUser = await createOrFindUserByEmail(email, lower);
  } catch (e) {
    return bad("Auth user create/find failed", origin, 500);
  }
  const { error: perr } = await sb.from("profiles").upsert({
    id: authUser.id,
    wallet_address: lower,
    updated_at: new Date().toISOString()
  });
  if (perr) return bad("Profile upsert failed", origin, 500);

  // Check if this is a new user (first time connecting)
  const { data: existingProfile } = await sb.from("profiles")
    .select("updated_at")
    .eq("id", authUser.id)
    .single();
  
  const isNewUser = !existingProfile || 
    (new Date(existingProfile.updated_at).getTime() === new Date().getTime());

  // Send Telegram alert for new users
  if (isNewUser) {
    try {
      const telegramBot = new TelegramBot();
      await telegramBot.sendNewUserAlert(lower, authUser.id);
    } catch (error) {
      console.error("Failed to send new user Telegram alert:", error);
      // Don't fail the auth process if Telegram fails
    }
  }
  const rt = randHex(32);
  const rth = await sha256Hex(rt);
  const now = new Date();
  const hardCap = new Date(now.getTime() + REFRESH_MAX_DAYS * 86400_000);
  const stepExp = new Date(now.getTime() + REFRESH_STEP_DAYS * 86400_000);
  const { error: serr } = await sb.from("auth_sessions").insert({
    user_id: authUser.id,
    refresh_hash: rth,
    created_at: now.toISOString(),
    expires_at: stepExp.toISOString(),
    hard_expires_at: hardCap.toISOString(),
    user_agent: req.headers.get("User-Agent") ?? "",
    ip: clientIp(req)
  });
  if (serr) return bad("Session create failed", origin, 500);
  let access;
  try {
    access = await signAccessJWT(authUser.id, lower);
  } catch (e) {
    return json(500, {
      error: "Server JWT misconfigured",
      detail: String(e.message)
    }, origin);
  }
  const res = json(200, {
    access_token: access,
    user: {
      id: authUser.id,
      wallet_address: lower
    }
  }, origin);
  setCookie(res, "__Host-rt", rt, {
    httpOnly: true,
    maxAge: REFRESH_MAX_DAYS * 86400
  });
  if (!getCookie(req, "__Host-csrf")) {
    res.headers.append("Set-Cookie", `__Host-csrf=${randHex(32)}; Path=/; Secure; SameSite=None; Max-Age=${REFRESH_MAX_DAYS * 86400}`);
  }
  return res;
}
async function handleRefresh(req, origin) {
  const csrfErr = requireCsrf(req, origin);
  if (csrfErr) return bad(csrfErr, origin, 403);
  const rt = getCookie(req, "__Host-rt");
  if (!rt) return bad("No refresh token", origin, 401);
  const rth = await sha256Hex(rt);
  const { data: s, error } = await sb.from("auth_sessions").select("id,user_id,refresh_hash,created_at,expires_at,hard_expires_at,revoked_at").eq("refresh_hash", rth).single();
  if (error || !s || s.revoked_at) return bad("Invalid session", origin, 401);
  const now = new Date();
  if (new Date(s.hard_expires_at) < now) return bad("Session max age reached", origin, 401);
  if (new Date(s.expires_at) < now) return bad("Session expired", origin, 401);
  const newRt = randHex(32);
  const newRth = await sha256Hex(newRt);
  const nextStep = new Date(now.getTime() + REFRESH_STEP_DAYS * 86400_000);
  const nextExpiry = new Date(Math.min(nextStep.getTime(), new Date(s.hard_expires_at).getTime()));
  await sb.from("auth_sessions").update({
    refresh_hash: newRth,
    expires_at: nextExpiry.toISOString(),
    last_used_at: now.toISOString()
  }).eq("id", s.id);
  const { data: prof, error: perr } = await sb.from("profiles").select("wallet_address").eq("id", s.user_id).single();
  if (perr || !prof) return bad("Profile not found", origin, 401);
  let access;
  try {
    access = await signAccessJWT(s.user_id, prof.wallet_address);
  } catch (e) {
    return json(500, {
      error: "Server JWT misconfigured",
      detail: String(e.message)
    }, origin);
  }
  const res = json(200, {
    access_token: access,
    user: {
      id: s.user_id,
      wallet_address: prof.wallet_address
    }
  }, origin);
  setCookie(res, "__Host-rt", newRt, {
    httpOnly: true,
    maxAge: Math.max(0, Math.floor((new Date(s.hard_expires_at).getTime() - now.getTime()) / 1000))
  });
  return res;
}
async function handleLogout(req, origin) {
  const csrfErr = requireCsrf(req, origin);
  if (csrfErr) return bad(csrfErr, origin, 403);
  const rt = getCookie(req, "__Host-rt");
  if (rt) {
    const rth = await sha256Hex(rt);
    await sb.from("auth_sessions").update({
      revoked_at: new Date().toISOString()
    }).eq("refresh_hash", rth);
  }
  const res = json(200, {
    success: true
  }, origin);
  clearCookie(res, "__Host-rt");
  return res;
}

console.info("auth function (dev) started");
Deno.serve(async (req)=>{
  const origin = req.headers.get("origin") ?? "";
  if (req.method === "OPTIONS") return new Response(null, {
    headers: cors(origin)
  });
  if (origin && origin !== APP_ORIGIN) return bad("Origin not allowed", origin, 403);
  const path = getPath(req);
  try {
    if (req.method === "GET" && path === "/csrf") return await handleCsrf(req, origin);
    if (req.method === "POST" && path === "/nonce") return await handleNonce(req, origin);
    if (req.method === "POST" && path === "/siwe-verify") return await handleSiweVerify(req, origin);
    if (req.method === "POST" && path === "/refresh") return await handleRefresh(req, origin);
    if (req.method === "POST" && path === "/logout") return await handleLogout(req, origin);
    return json(404, {
      error: "Not found"
    }, origin);
  } catch (e) {
    console.error(e);
    
    // Send error alert to Telegram
    try {
      await safeTelegramAlert(`
🚨 <b>Auth Function Error</b>

❌ <b>Error:</b> <code>${String(e)}</code>
📍 <b>Path:</b> ${path}
⏰ <b>Time:</b> ${new Date().toISOString()}
      `);
    } catch (telegramError) {
      console.error("Failed to send error alert to Telegram:", telegramError);
    }
    
    return json(500, {
      error: "Internal error"
    }, origin);
  }
});
