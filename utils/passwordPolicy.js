/*
 * Password policy: 12+ chars, at least one lowercase, one uppercase, one digit,
 * one symbol. Returns { ok: true } or { ok: false, reason }.
 *
 * Why a custom function and not a regex string:
 *   - Per-rule reason makes UX much better than a single "doesn't match" error.
 *   - Easier to extend with breach-list / zxcvbn later without rewriting callers.
 */

const MIN_LENGTH = 12;

const validatePassword = (password) => {
  if (typeof password !== "string") return { ok: false, reason: "Password is required" };
  if (password.length < MIN_LENGTH)
    return { ok: false, reason: `Password must be at least ${MIN_LENGTH} characters` };
  if (password.length > 128)
    return { ok: false, reason: "Password is too long (max 128 characters)" };
  if (!/[a-z]/.test(password))
    return { ok: false, reason: "Password must contain a lowercase letter" };
  if (!/[A-Z]/.test(password))
    return { ok: false, reason: "Password must contain an uppercase letter" };
  if (!/[0-9]/.test(password))
    return { ok: false, reason: "Password must contain a digit" };
  if (!/[^a-zA-Z0-9]/.test(password))
    return { ok: false, reason: "Password must contain a symbol" };
  return { ok: true };
};

module.exports = { validatePassword, MIN_LENGTH };
