const EMAIL_RE = /^\S+@\S+\.\S+$/;

export function validateRegister({ name = "", email = "", password = "" } = {}) {
  const errors = [];

  if (typeof name !== "string" || name.trim().length < 2) {
    errors.push({ field: "name", message: "Name must be at least 2 characters" });
  }

  if (typeof email !== "string" || !EMAIL_RE.test(email.trim())) {
    errors.push({ field: "email", message: "A valid email is required" });
  }

  if (typeof password !== "string" || password.length < 8) {
    errors.push({ field: "password", message: "Password must be at least 8 characters" });
  }

  return errors;
}

export function validateLogin({ email = "", password = "" } = {}) {
  const errors = [];

  if (typeof email !== "string" || !EMAIL_RE.test(email.trim())) {
    errors.push({ field: "email", message: "A valid email is required" });
  }

  if (typeof password !== "string" || password.length < 8) {
    errors.push({ field: "password", message: "Password must be at least 8 characters" });
  }

  return errors;
}
