import compression from 'compression';
import dotenv from 'dotenv';
import express from 'express';
import fetch from 'node-fetch';
import fs from 'fs/promises';
import helmet from 'helmet';
import multer from 'multer';
import nodemailer from 'nodemailer';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 8888);
const maxFileSize = 10 * 1024 * 1024;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = __dirname;
const dataDir = path.join(__dirname, '.data');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxFileSize }
});

app.use(
  helmet({
    contentSecurityPolicy: false
  })
);
app.use(compression());
app.use((req, res, next) => {
  const blocked = new Set(['/server.js', '/package.json', '/.env', '/.env.example']);
  if (blocked.has(req.path) || req.path.startsWith('/.')) {
    return res.status(404).end();
  }
  return next();
});
app.use(express.static(publicDir));

const hasSmtp = () =>
  Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS && process.env.SMTP_TO);

const sanitizeName = (value = '') => value.replace(/[^a-zA-Z0-9._-]+/g, '_');

const verifyRecaptcha = async (token) => {
  const secret = process.env.RECAPTCHA_SECRET;
  if (!secret || !token) return { ok: true, skipped: true };

  const payload = new URLSearchParams({
    secret,
    response: token
  });

  const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    body: payload
  });

  if (!res.ok) {
    return { ok: false, error: 'captcha_request_failed' };
  }

  const data = await res.json();
  return { ok: Boolean(data.success), data };
};

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.post('/api/contact', upload.single('file'), async (req, res) => {
  try {
    const { name, email, subject, message, phone, consent, 'g-recaptcha-response': captcha } = req.body;

    if (!name || !email || !subject || !message || !consent) {
      return res.status(400).json({ ok: false, error: 'missing_fields' });
    }

    if (req.file && req.file.size > maxFileSize) {
      return res.status(400).json({ ok: false, error: 'file_too_large' });
    }

    const captchaCheck = await verifyRecaptcha(captcha);
    if (!captchaCheck.ok) {
      return res.status(400).json({ ok: false, error: 'captcha_failed' });
    }

    const entry = {
      name,
      email,
      subject,
      message,
      phone: phone || '',
      consent: Boolean(consent),
      file: req.file
        ? {
            name: req.file.originalname,
            type: req.file.mimetype,
            size: req.file.size
          }
        : null,
      createdAt: new Date().toISOString()
    };

    await fs.mkdir(dataDir, { recursive: true });

    const stamp = Date.now();
    const safeName = sanitizeName(entry.name || 'contact');
    const entryPath = path.join(dataDir, `${stamp}-${safeName}.json`);
    await fs.writeFile(entryPath, JSON.stringify(entry, null, 2), 'utf8');

    if (req.file) {
      const uploadsDir = path.join(dataDir, 'uploads');
      await fs.mkdir(uploadsDir, { recursive: true });
      const fileName = sanitizeName(req.file.originalname || `upload-${stamp}`);
      const filePath = path.join(uploadsDir, `${stamp}-${fileName}`);
      await fs.writeFile(filePath, req.file.buffer);
    }

    let mailSent = false;
    if (hasSmtp()) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: Number(process.env.SMTP_PORT || 587) === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: process.env.SMTP_TO,
        replyTo: email,
        subject: `Novy kontakt: ${subject}`,
        text: `Jmeno: ${name}\nE-mail: ${email}\nTelefon: ${phone || '-'}\n\nZprava:\n${message}`,
        attachments: req.file
          ? [
              {
                filename: req.file.originalname,
                content: req.file.buffer,
                contentType: req.file.mimetype
              }
            ]
          : []
      });

      mailSent = true;
    }

    return res.status(200).json({ ok: true, mailSent });
  } catch (err) {
    console.error('Contact submission failed:', err);
    return res.status(500).json({ ok: false, error: 'server_error' });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
