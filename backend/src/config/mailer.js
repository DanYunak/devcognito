const nodemailer = require('nodemailer');
const env = require('./env');

const transporter = nodemailer.createTransport({
  host: env.smtpHost,
  port: env.smtpPort,
  secure: env.smtpPort === 465,
  auth: {
    user: env.smtpUser,
    pass: env.smtpPass
  }
});

const sendMail = async ({ to, subject, html, text }) => {
  return transporter.sendMail({
    from: env.smtpFrom,
    to,
    subject,
    html,
    text
  });
};

module.exports = { sendMail };
