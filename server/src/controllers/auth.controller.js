import {
  register,
  login,
  logout,
  getAuthCookieOptions,
} from "../services/auth.service.js";
import {
  validateRegister,
  validateLogin,
} from "../validators/auth.validator.js";

function setAuthCookie(res, token) {
  res.cookie("token", token, getAuthCookieOptions(token));
}

function clearAuthCookie(res) {
  // Options must match the set-cookie ones (minus maxAge).
  res.clearCookie("token", getAuthCookieOptions());
}

export async function registerHandler(req, res, next) {
  try {
    const errors = validateRegister(req.body || {});
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }
    const { user, token } = await register(req.body);
    setAuthCookie(res, token);
    res.status(201).json({ user });
  } catch (err) {
    next(err);
  }
}

export async function loginHandler(req, res, next) {
  try {
    const errors = validateLogin(req.body || {});
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }
    const { user, token } = await login(req.body);
    setAuthCookie(res, token);
    res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
}

export async function logoutHandler(req, res, next) {
  try {
    logout();
    clearAuthCookie(res);
    res.status(200).json({ ok: true });
  } catch (err) {
    next(err);
  }
}

export async function meHandler(req, res) {
  res.status(200).json({ user: req.user });
}
