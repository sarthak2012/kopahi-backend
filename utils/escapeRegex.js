/*
 * Escape user input destined for a RegExp constructor. Prevents ReDoS by
 * stripping every regex metacharacter so the input can only ever match
 * literally. (Not the same as escaping for shell or HTML.)
 */
const escapeRegex = (str) =>
  String(str || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

module.exports = escapeRegex;
