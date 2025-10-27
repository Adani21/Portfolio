// server.js — Express + SendGrid (root index, optioneel /contact)
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

// EU account? zet in Render env: SENDGRID_EU=1
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

// Static uit de root (assets, css, script.js, html)
app.use(express.static(path.join(__dirname)));

// Root => index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Optioneel: /contact => contact.html
app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, 'contact.html'));
});

// Helpers
const emailRe  = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
const twoWords = v => String(v||'').trim().split(/\s+/).length >= 2;
const esc = s => String(s||'')
  .replace(/&/g,'&amp;').replace(/</g,'&lt;')
  .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');

// POST /send (SendGrid)
app.post('/send', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body || {};
    if (!twoWords(name) || !emailRe.test(String(email).trim()) || !subject || !message) {
      return res.status(400).json({ ok:false, error:'Invalid input' });
    }

    const fromVerified = process.env.FROM_EMAIL;       // geverifieerd in SendGrid
    const toAddress    = process.env.TO_EMAIL || fromVerified;
    if (!fromVerified) return res.status(500).json({ ok:false, error:'Missing FROM_EMAIL' });

    const msg = {
      to: toAddress,
      from: fromVerified,          // MOET geverifieerd zijn (Single Sender of Domain Auth)
      replyTo: email,              // user komt in replyTo, nooit in from
      subject: `Nieuw bericht: ${subject} — ${name}`,
      text: `Naam: ${name}\nEmail: ${email}\nOnderwerp: ${subject}\n\n${message}`,
      html: `
        <p><strong>Naam:</strong> ${esc(name)}</p>
        <p><strong>Email:</strong> ${esc(email)}</p>
        <p><strong>Onderwerp:</strong> ${esc(subject)}</p>
        <p><strong>Bericht:</strong><br>${esc(message).replace(/\n/g,'<br>')}</p>
      `
    };

    const [resp] = await sgMail.send(msg);
    console.log('SendGrid:', resp.statusCode, resp.headers['x-message-id']);
    return res.status(202).json({ ok:true });
  } catch (err) {
    if (err?.response?.body) console.error('SENDGRID ERROR BODY:', err.response.body);
    console.error('SENDGRID ERROR:', err);
    return res.status(500).json({ ok:false, error:'Mail send failed' });
  }
});

app.listen(PORT, () => console.log(`API on :${PORT}`));
