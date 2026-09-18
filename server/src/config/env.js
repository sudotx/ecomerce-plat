const PLACEHOLDER_SECRET = "change-me-to-a-long-random-string";

/**
 * Fail-fast env validation, run before the server binds or connects to
 * Mongo. Throws if JWT_SECRET is missing or still the placeholder so
 * auth tokens can never be signed with a known secret.
 */
export function validateEnv() {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not set. Add it to server/.env.");
  }
  if (process.env.JWT_SECRET === PLACEHOLDER_SECRET) {
    throw new Error(
      "JWT_SECRET is still the placeholder. Set a real random value in server/.env."
    );
  }
}
