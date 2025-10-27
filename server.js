// server.js — afgestemd op jouw root-structuur

// Imports & setup
const express = require('express');
const cors = require('cors');
const path = require('path');
const sgMail = require('@sendgrid/mail');
require('dotenv').config();

const app  = express();
const PORT = process.env.PORT || 3000;

// SendGrid initialisatie
// Vereist: SENDGRID_API_KEY (en optioneel: SENDGRID_EU, FROM_EMAIL, TO_EMAIL)
if (!process.env.SENDGRID_API_KEY) {
  console.error('Missing SENDGRID_API_KEY'); process.exit(1);
}
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Optioneel: EU endpoint (voor EU-datacenter/routing)
if (process.env.SENDGRID_EU === '1') {
  const { Client } = require('@sendgrid/client');
  const client = new Client();
  client.setApiKey(process.env.SENDGRID_API_KEY);
  client.setDefaultRequest('host', 'https://api.eu.sendgrid.com');
  sgMail.client = client;
}

// Middleware
app.use(cors({  
  // Sta lokale dev-origins toe; ALLOW_ORIGIN kan extern domein overschrijven/toevoegen
  origin: [
    process.env.ALLOW_ORIGIN || 'http://localhost:5173',
    'http://localhost:5173',
    'http://localhost:3000'
  ],
  methods: ['POST','GET'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json({ limit: '100kb' })); // JSON body parser met limiet

// Static files: serve alles uit de projectroot (index.html, contact.html, assets, css, js)
app.use(express.static(path.join(__dirname)));

// Route: root -> index.html (direct uit de root laden)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Route: /contact -> contact.html (directe navigatie naar contactpagina)
app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, 'contact.html'));
});

// Helpers voor validatie & HTML-escaping
const emailRe  = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
const twoWords = v => String(v||'').trim().split(/\s+/).length >= 2;
const esc = s => String(s||'')
  .replace(/&/g,'&amp;').replace(/</g,'&lt;')
  .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');

// API endpoint: mail versturen via SendGrid
app.post('/send', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body || {};

    // Server-side validatie (naam=2 woorden, geldig e-mail, subject en message verplicht)
    if (!twoWords(name) || !emailRe.test(String(email).trim()) || !subject || !message) {
      return res.status(400).json({ ok:false, error:'Invalid input' });
    }

    // Van- en naar-adressen uit env; FROM_EMAIL moet geverifieerd zijn in SendGrid
    const fromVerified = process.env.FROM_EMAIL;            // geverifieerde afzender
    const toAddress    = process.env.TO_EMAIL || fromVerified;
    if (!fromVerified) return res.status(500).json({ ok:false, error:'Missing FROM_EMAIL' });

    // Opstellen bericht (text + eenvoudige HTML, met escaping)
    const msg = {
      to: toAddress,
      from: fromVerified,
      replyTo: email,  // zodat je direct kunt antwoorden op de afzender
      subject: `Nieuw bericht: ${subject} — ${name}`,
      text: `Naam: ${name}\nEmail: ${email}\nOnderwerp: ${subject}\n\n${message}`,
      html: `
        <p><strong>Naam:</strong> ${esc(name)}</p>
        <p><strong>Email:</strong> ${esc(email)}</p>
        <p><strong>Onderwerp:</strong> ${esc(subject)}</p>
        <p><strong>Bericht:</strong><br>${esc(message).replace(/\n/g,'<br>')}</p>
      `
    };

    // Verzenden via SendGrid
    const sgRes = await sgMail.send(msg);
    console.log('SendGrid status:', sgRes[0]?.statusCode);

    // 202 = geaccepteerd door SendGrid (async delivery)
    return res.status(202).json({ ok:true });

  } catch (err) {
    // Log detailinfo van SendGrid-responses waar beschikbaar
    if (err?.response?.body) console.error('SENDGRID ERROR BODY:', err.response.body);
    console.error('SENDGRID ERROR:', err);
    return res.status(500).json({ ok:false, error:'Mail send failed' });
  }
});

// Server start
app.listen(PORT, () => console.log(`API on :${PORT}`));
