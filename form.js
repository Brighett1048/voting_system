// form.js
// Handles client-side validation and submission safely.
// Prevents navigation when the page is opened via file:// to avoid ERR_FILE_NOT_FOUND.
// Shows the exact confirmation message requested in the #confirmation region.

(function () {
  'use strict';

  // Small helpers
  function digitsOnly(str) { return (str || '').replace(/\D/g, ''); }

  // Luhn-style check for SA ID (13 digits, last digit checksum)
  function luhnCheck(id13) {
    var s = digitsOnly(id13);
    if (!/^\d{13}$/.test(s)) { return false; }
    var digits = s.split('').map(function (d) { return parseInt(d, 10); });
    var checkDigit = digits.pop();
    var sum = 0;
    for (var i = digits.length - 1, pos = 0; i >= 0; i--, pos++) {
      var d = digits[i];
      if (pos % 2 === 0) {
        var doubled = d * 2;
        if (doubled > 9) { doubled = Math.floor(doubled / 10) + (doubled % 10); }
        sum += doubled;
      } else {
        sum += d;
      }
    }
    var calcCheck = (10 - (sum % 10)) % 10;
    return calcCheck === checkDigit;
  }

  // DOM refs
  var form = document.getElementById('voter-ballot-form');
  if (!form) { return; }

  var idInput = document.getElementById('id_number');
  var nameInput = document.getElementById('full_name');
  var addressInput = document.getElementById('address');
  var phoneInput = document.getElementById('phone');
  var emailInput = document.getElementById('email');
  var confirmationEl = document.getElementById('confirmation');
  var resetBtn = document.getElementById('reset-btn');
  var candidateError = document.getElementById('candidate-error');

  var idError = document.getElementById('id-error');
  var nameError = document.getElementById('name-error');
  var addressError = document.getElementById('address-error');
  var phoneError = document.getElementById('phone-error');
  var emailError = document.getElementById('email-error');

  // Small validation helpers
  function validateName() {
    var v = (nameInput && nameInput.value || '').trim();
    if (v.length < 2) {
      if (nameError) nameError.textContent = 'Please enter your full names.';
      if (nameInput) nameInput.setAttribute('aria-invalid', 'true');
      return false;
    }
    if (nameError) nameError.textContent = '';
    if (nameInput) nameInput.setAttribute('aria-invalid', 'false');
    return true;
  }
  function validateAddress() {
    var v = (addressInput && addressInput.value || '').trim();
    if (v.length < 5) {
      if (addressError) addressError.textContent = 'Please enter your address.';
      if (addressInput) addressInput.setAttribute('aria-invalid', 'true');
      return false;
    }
    if (addressError) addressError.textContent = '';
    if (addressInput) addressInput.setAttribute('aria-invalid', 'false');
    return true;
  }
  function validatePhone() {
    var v = (phoneInput && phoneInput.value || '').trim();
    var digits = digitsOnly(v);
    if (digits.length < 9 || digits.length > 15) {
      if (phoneError) phoneError.textContent = 'Please enter a valid phone number (9–15 digits).';
      if (phoneInput) phoneInput.setAttribute('aria-invalid', 'true');
      return false;
    }
    if (phoneError) phoneError.textContent = '';
    if (phoneInput) phoneInput.setAttribute('aria-invalid', 'false');
    return true;
  }
  function validateEmail() {
    var v = (emailInput && emailInput.value || '').trim();
    if (v === '') {
      if (emailError) emailError.textContent = '';
      if (emailInput) emailInput.setAttribute('aria-invalid', 'false');
      return true;
    }
    var re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(v)) {
      if (emailError) emailError.textContent = 'Please enter a valid email address or leave blank.';
      if (emailInput) emailInput.setAttribute('aria-invalid', 'true');
      return false;
    }
    if (emailError) emailError.textContent = '';
    if (emailInput) emailInput.setAttribute('aria-invalid', 'false');
    return true;
  }

  // Real-time ID feedback (non-blocking)
  if (idInput) {
    idInput.addEventListener('input', function () {
      var v = digitsOnly(idInput.value);
      if (v.length > 13) v = v.slice(0, 13);
      idInput.value = v;
      if (v.length === 13) {
        if (luhnCheck(v)) {
          if (idError) idError.textContent = '';
          idInput.setAttribute('aria-invalid', 'false');
        } else {
          if (idError) idError.textContent = 'ID appears invalid (checksum failed).';
          idInput.setAttribute('aria-invalid', 'true');
        }
      } else {
        if (idError) idError.textContent = v.length === 0 ? '' : 'ID should be 13 digits.';
        idInput.setAttribute('aria-invalid', 'true');
      }
    }, false);
  }

  // helper to get selected candidate
  function getSelectedCandidate() {
    var radios = form.querySelectorAll('input[name="candidate"]');
    for (var i = 0; i < radios.length; i++) {
      if (radios[i].checked) return radios[i].value;
    }
    return null;
  }

  // Show the requested confirmation message exactly (and accessibly)
  function showConfirmation() {
    var message = 'thanks for voting , your vote was succesful, you can exit the site';
    if (confirmationEl) {
      confirmationEl.style.color = ''; // use CSS default
      confirmationEl.textContent = message;
      // move focus for screen-reader/keyboard users
      try { confirmationEl.focus(); } catch (e) { /* ignore */ }
    }
    // optional immediate alert and TTS
    try { window.alert(message); } catch (e) { /* ignore */ }
    if (window.speechSynthesis) {
      try {
        var ut = new SpeechSynthesisUtterance(message);
        window.speechSynthesis.speak(ut);
      } catch (e) { /* ignore */ }
    }
  }

  // Submit handler: validates and either posts to server (http/s) or simulates success (file://)
  form.addEventListener('submit', function (ev) {
    ev.preventDefault();

    // Clear candidate error
    if (candidateError) candidateError.textContent = '';

    var idVal = idInput ? digitsOnly(idInput.value) : '';
    var ok = true;

    if (!/^\d{13}$/.test(idVal) || !luhnCheck(idVal)) {
      if (idError) idError.textContent = 'Please provide a valid 13-digit ID number.';
      if (idInput) idInput.focus();
      ok = false;
    } else {
      if (idError) idError.textContent = '';
    }

    if (!validateName()) ok = false;
    if (!validateAddress()) ok = false;
    if (!validatePhone()) ok = false;
    if (!validateEmail()) ok = false;

    var candidate = getSelectedCandidate();
    if (!candidate) {
      if (candidateError) candidateError.textContent = 'Please select one candidate.';
      ok = false;
    } else {
      if (candidateError) candidateError.textContent = '';
    }

    if (!ok) return;

    // disable form controls to prevent double submit
    var buttons = form.querySelectorAll('button, input[type="submit"]');
    buttons.forEach && buttons.forEach(function (b) { b.disabled = true; });

    // Build payload (sanitize as needed; do not log PII in production)
    var payload = {
      id_number: idVal,
      full_name: nameInput ? nameInput.value.trim() : '',
      address: addressInput ? addressInput.value.trim() : '',
      phone: phoneInput ? phoneInput.value.trim() : '',
      email: emailInput ? emailInput.value.trim() : '',
      candidate: candidate
    };

    // If page served over http(s), attempt to POST to server; otherwise simulate success.
    var protocol = location.protocol || '';
    if (protocol.indexOf('http') === 0) {
      // POST to form.action (relative or absolute)
      var submitUrl = form.getAttribute('action') || location.href;
      // Use fetch with JSON body; server should accept this or adjust accordingly.
      fetch(submitUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'same-origin'
      }).then(function (resp) {
        if (!resp.ok) throw new Error('Server returned ' + resp.status);
        // prefer server confirmation, but still show the required message
        showConfirmation();
      }).catch(function (err) {
        // If server submission failed, re-enable controls and show error
        buttons.forEach && buttons.forEach(function (b) { b.disabled = false; });
        if (confirmationEl) {
          confirmationEl.style.color = '#b91c1c';
          confirmationEl.textContent = 'Submission failed. Please try again or ask staff for assistance.';
        } else {
          try { window.alert('Submission failed. Please try again.'); } catch (e) { /* ignore */ }
        }
        console.error('Submission error:', err);
      });
    } else {
      // Running from file:// — do NOT attempt navigation, just show confirmation message
      showConfirmation();
    }
  }, false);

  // Reset handler
  if (resetBtn) {
    resetBtn.addEventListener('click', function () {
      [idError, nameError, addressError, phoneError, emailError, candidateError].forEach(function (el) {
        if (el) el.textContent = '';
      });
      if (confirmationEl) confirmationEl.textContent = '';
      var buttons = form.querySelectorAll('button, input[type="submit"]');
      buttons.forEach && buttons.forEach(function (b) { b.disabled = false; });
    }, false);
  }

})();