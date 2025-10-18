// vote.js - handle selection validation and confirmation message
(function () {
  'use strict';

  var form = document.getElementById('vote-form');
  var confirmBtn = document.getElementById('confirm-vote');
  var cancelBtn = document.getElementById('cancel');
  var confirmationEl = document.getElementById('confirmation');

  function getSelectedCandidate() {
    var radios = form.querySelectorAll('input[name="candidate"]');
    for (var i = 0; i < radios.length; i++) {
      if (radios[i].checked) { return radios[i].value; }
    }
    return null;
  }

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();

    var selected = getSelectedCandidate();
    if (!selected) {
      // show inline error near confirmation region
      confirmationEl.textContent = 'Please select a candidate before confirming.';
      confirmationEl.style.color = '#b91c1c';
      confirmationEl.focus && confirmationEl.focus();
      return;
    }

    // disable controls to prevent double submit
    confirmBtn.disabled = true;
    cancelBtn.disabled = true;

    // Show the exact confirmation message requested (announced to assistive tech via aria-live)
    var message = 'thanks for voting , your vote was succesful, you can exit the site';
    confirmationEl.style.color = ''; // reset to default (blue)
    confirmationEl.textContent = message;

    // Also show an alert for immediate feedback (optional)
    try { window.alert(message); } catch (e) { /* ignore */ }

    // In production, here you would:
    // - send the anonymous ballot token + selection to the ballot server via fetch()
    // - handle server response, errors and possibly display a printed receipt token
    // For demo, we just show the confirmation text and leave the form disabled.
  }, false);

  cancelBtn.addEventListener('click', function () {
    // allow user to reselect: clear selection and messages
    var radios = form.querySelectorAll('input[name="candidate"]');
    radios.forEach && radios.forEach(function (r) { r.checked = false; });
    confirmationEl.textContent = '';
    confirmBtn.disabled = false;
    cancelBtn.disabled = false;
  }, false);

})();