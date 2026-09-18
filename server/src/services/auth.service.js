import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/user.model.js";

const BCRYPT_COST = 10;

function signToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

/** Cookie lifetime mirrors the JWT exp exactly, whatever its format. */
function cookieMaxAgeMs(token) {
  const { exp } = jwt.decode(token);
  return exp * 1000 - Date.now();
}

/**
 * Cookie options for the auth cookie. Set and clear must agree on
 * httpOnly/sameSite/secure so clearCookie removes it reliably.
 */
export function getAuthCookieOptions(token) {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: token ? cookieMaxAgeMs(token) : undefined,
  };
}

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

/** The only user shape ever sent to clients. */
function sanitizeUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

function authError(message, status) {
  const err = new Error(message);
  err.status = status;
  return err;
}

export async function register({ name = "", email = "", password = "" }) {
  const normalizedEmail = normalizeEmail(email);

  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    throw authError("An account with this email already exists", 409);
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);

  let user;
  try {
    user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
    });
  } catch (err) {
    // Race on the unique index defeats check-then-insert.
    if (err?.code === 11000) {
      throw authError("An account with this email already exists", 409);
    }
    throw err;
  }

  return { user: sanitizeUser(user), token: signToken(user) };
}

export async function login({ email = "", password = "" }) {
  const user = await User.findOne({ email: normalizeEmail(email) }).select(
    "+passwordHash"
  );
  if (!user) {
    throw authError("Invalid email or password", 401);
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw authError("Invalid email or password", 401);
  }
  return { user: sanitizeUser(user), token: signToken(user) };
}

export async function getCurrentUser(userId) {
  const user = await User.findById(userId);
  if (!user) {
    // Valid token but the account no longer exists — treat as logged out.
    throw authError("Not authenticated", 401);
  }
  return sanitizeUser(user);
}

export function logout() {
  return { ok: true };
}
