import jwt from "jsonwebtoken";
import { getCurrentUser } from "../services/auth.service.js";

/**
 * Express middleware: requires a valid auth cookie AND a live user.
 * Attaches req.user = { id, name, email, role } on success.
 */
export async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.token;
    if (!token) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await getCurrentUser(payload.sub);
    next();
  } catch {
    // Expired, tampered, or the user was deleted.
    return res.status(401).json({ message: "Not authenticated" });
  }
}
