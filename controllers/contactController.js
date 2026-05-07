const db = require("../db");
const asyncHandler = require("../middleware/asyncHandler");
const { sendEmail, escapeHtml } = require("../utils/sendEmail");
const logger = require("../utils/logger");

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
    emailDelivered: false,
  });

  let emailDelivered = false;
  let emailError = "";
  try {
    const result = await sendEmail({
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
    emailDelivered = !result.skipped;
    if (result.skipped) {
      emailError = "SMTP not configured";
      logger.warn("contact_email_skipped", {
        leadId: lead._id.toString(),
        reason: "smtp_not_configured",
        requestId: req.id,
      });
    } else {
      logger.info("contact_email_sent", {
        leadId: lead._id.toString(),
        messageId: result.messageId,
        requestId: req.id,
      });
    }
  } catch (err) {
    emailError = err.message || "Send failed";
    logger.error("contact_email_failed", {
      leadId: lead._id.toString(),
      err: err.message,
      requestId: req.id,
    });
  }

  await db.leads.updateById(lead._id, { emailDelivered, emailError });

  res.status(201).json({
    success: true,
    message: "Thanks — we'll get back to you within 24 hours",
    lead,
  });
});
