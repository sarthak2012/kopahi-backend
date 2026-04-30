const db = require("../db");
const asyncHandler = require("../middleware/asyncHandler");
const { sendEmail, escapeHtml } = require("../utils/sendEmail");

exports.sendLead = asyncHandler(async (req, res) => {
  const { name, email, phone, message, subject } = req.body || {};

  if (!name || !email || !message) {
    return res.status(400).json({
      success: false,
      message: "Name, email and message are required",
    });
  }

  const lead = await db.leads.create({
    name,
    email,
    phone: phone || "",
    message,
    source: subject ? `Website (${subject})` : "Website",
  });

  try {
    await sendEmail({
      subject: "New Kopahi Lead",
      html: `
        <h2>Lead received</h2>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Phone:</strong> ${escapeHtml(phone || "—")}</p>
        ${subject ? `<p><strong>Subject:</strong> ${escapeHtml(subject)}</p>` : ""}
        <p><strong>Message:</strong></p>
        <p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>
      `,
    });
  } catch (err) {
    console.error("[contact] email failed:", err.message);
  }

  res.status(201).json({
    success: true,
    message: "Thanks — we'll get back to you within 24 hours",
    lead,
  });
});
