// /js/contact.js
(() => {
  const form      = document.querySelector('.cf-form');
  if (!form) return;

  const nameEl    = document.getElementById('cf-name');
  const emailEl   = document.getElementById('cf-email');
  const subjectEl = document.getElementById('cf-subject') || document.getElementById('cf-dropdown');
  const messageEl = document.getElementById('cf-message');
  const statusEl  = document.getElementById('cf-status') || (() => {
    const p = document.createElement('p');
    p.id = 'cf-status';
    p.className = 'cf-status';
    form.appendChild(p);
    return p;
  })();

  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
  const hasTwoWords = v => v.trim().split(/\s+/).length >= 2;

  function setError(field, on){
    const wrap = field?.closest('.cf-field');
    if (!wrap) return;
    wrap.classList.toggle('is-error', on);
    if (on){
      clearTimeout(wrap._cfTimer);
      wrap._cfTimer = setTimeout(() => wrap.classList.remove('is-error'), 3000);
    }
  }
  function showStatus(t, color = '#e06b6b'){ statusEl.textContent = t; statusEl.style.color = color; }
  function clearStatus(){ statusEl.textContent = ''; }

  // live clear on input
  [nameEl, emailEl, subjectEl, messageEl].forEach(el => el?.addEventListener('input', () => setError(el, false)));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearStatus();

    let bad = false;

    if (!hasTwoWords(nameEl.value))                 { setError(nameEl, true);    bad = true; }
    if (!emailRe.test(emailEl.value.trim()))        { setError(emailEl, true);   bad = true; }
    if (!subjectEl || !subjectEl.value.trim())      { setError(subjectEl, true); bad = true; }
    if (!messageEl.value.trim())                    { setError(messageEl, true); bad = true; }

    if (bad){
      showStatus('❌ Please enter your full name (two words), a valid email, a subject, and a message.');
      return;
    }

    const btn = form.querySelector('.cf-cta');
    const original = btn.innerHTML;
    btn.disabled = true;
    btn.setAttribute('aria-busy', 'true');
    btn.innerHTML = 'Sending…';

    try{
      const payload = {
        name: nameEl.value.trim(),
        email: emailEl.value.trim(),
        message: `${subjectEl.value.trim()}\n\n${messageEl.value.trim()}`
      };

      const res = await fetch('https://<your-service>.onrender.com/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.status === 200 || res.status === 202){
        showStatus('✅ Message successfully sent!', 'lightgreen');
        form.reset();
        setTimeout(clearStatus, 3000);
      } else {
        showStatus('❌ Something went wrong on the server.');
      }
    } catch (err){
      console.error(err);
      showStatus('⚠️ Can’t connect to the server.');
    } finally {
      btn.disabled = false;
      btn.removeAttribute('aria-busy');
      btn.innerHTML = original;
    }
  });
})();
