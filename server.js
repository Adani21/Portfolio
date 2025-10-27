import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';

const app = express();
app.use(cors({ origin: ['https://adani.dev','http://localhost:5173'], methods: ['POST'], allowedHeaders: ['Content-Type'] }));
app.use(express.json());

app.get('/', (req,res)=>res.status(200).send('OK'));

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
});

app.post('/send', async (req, res) => {
  try {
    const { name, email, message } = req.body || {};
    if (!name || !email || !message) return res.status(400).json({ ok:false, error:'Missing fields' });

    await transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to: process.env.TO_EMAIL || process.env.FROM_EMAIL,
      subject: `Contact: ${name}`,
      replyTo: email,
      text: message
    });

    res.status(202).json({ ok:true });
  } catch (e) {
    console.error('SEND ERROR', e);
    res.status(500).json({ ok:false, error:'Internal error' });
  }
});

app.use((err, req, res, next) => {
  console.error('UNCAUGHT', err);
  res.status(500).json({ ok:false, error:'Server error' });
});

const port = process.env.PORT || 10000;
app.listen(port, () => console.log('API on :' + port));
