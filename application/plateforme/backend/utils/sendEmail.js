const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

module.exports = async ({ to, subject, html }) => {
  await transporter.sendMail({
    from: `"Smart Attendance" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html,
  });
};