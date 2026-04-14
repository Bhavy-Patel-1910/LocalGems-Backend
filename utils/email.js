const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

const sendEmail = async ({ to, subject, html, text }) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'LocalGems <noreply@localgems.in>',
    to, subject, html, text,
  };
  return transporter.sendMail(mailOptions);
};

module.exports = { sendEmail };
