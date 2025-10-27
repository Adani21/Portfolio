// server.js — afgestemd op jouw root-structuur
const express = require('express');
const cors = require('cors');
const path = require('path');
const sgMail = require('@sendgrid/mail');
require('dotenv').config();

const app  = express();
const PORT = process.env.PORT || 3000;

// SendGrid init
if (!process.env.SENDGRID_API_KEY) {
  console.error('Missing SENDGRID_API_KEY'); process.exit(1);
}
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

if (process.env.SENDGRID_EU === '1') {
  const { Client } = require('@sendgrid/client');
  const client = new Client();
  client.setApiKey(process.env.SENDGRID_API_KEY);
  client.setDefaultRequest('host', 'https://api.eu.sendgrid.com');
  sgMail.client = client;
}

// Middleware
app.use(cors({  
  origin: [
    process.env.ALLOW_ORIGIN || 'http://localhost:5173',
    'http://localhost:5173',
    'http://localhost:3000'
  ],
  methods: ['POST','GET'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json({ limit: '100kb' }));

// Static: serve alles uit de root en submappen (assets, css)
app.use(express.static(path.join(__dirname)));

// ROOT -> index.html (exact jouw bestand in de root)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// /contact -> contact.html (alleen als je hierheen navigeert)
app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, 'contact.html'));
});

// Helpers
const emailRe  = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
const twoWords = v => String(v||'').trim().split(/\s+/).length >= 2;
const esc = s => String(s||'')
  .replace(/&/g,'&amp;').replace(/</g,'&lt;')
  .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');

// API: mail
app.post('/send', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body || {};
    if (!twoWords(name) || !emailRe.test(String(email).trim()) || !subject || !message) {
      return res.status(400).json({ ok:false, error:'Invalid input' });
    }

    const fromVerified = process.env.FROM_EMAIL;           // geverifieerd in SendGrid
    const toAddress    = process.env.TO_EMAIL || fromVerified;
    if (!fromVerified) return res.status(500).json({ ok:false, error:'Missing FROM_EMAIL' });

    const msg = {
      to: toAddress,
      from: fromVerified,
      replyTo: email,
      subject: `Nieuw bericht: ${subject} — ${name}`,
      text: `Naam: ${name}\nEmail: ${email}\nOnderwerp: ${subject}\n\n${message}`,
      html: `
        <p><strong>Naam:</strong> ${esc(name)}</p>
        <p><strong>Email:</strong> ${esc(email)}</p>
        <p><strong>Onderwerp:</strong> ${esc(subject)}</p>
        <p><strong>Bericht:</strong><br>${esc(message).replace(/\n/g,'<br>')}</p>
      `
    };

    const sgRes = await sgMail.send(msg);
    console.log('SendGrid status:', sgRes[0]?.statusCode);
    return res.status(202).json({ ok:true });
  } catch (err) {
    if (err?.response?.body) console.error('SENDGRID ERROR BODY:', err.response.body);
    console.error('SENDGRID ERROR:', err);
    return res.status(500).json({ ok:false, error:'Mail send failed' });
  }
});

// Start
app.listen(PORT, () => console.log(`API on :${PORT}`));
