document.addEventListener('DOMContentLoaded', () => {
  const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzHDW-urlNrN-KoqTYL2aB6RhcIwkTK4wxrh6BL_do/dev';

  // ----- Get the form first and bail fast if missing -----
  const form = document.getElementById('bookingForm');
  if (!form) {
    console.error('Critical: <form id="bookingForm"> not found in DOM. Aborting script.');
    return;
  }

  // ----- Query children only after confirming the form exists -----
  const serviceItems = document.querySelectorAll('.service-item'); // ok if empty
  const selectedServicesInput = document.getElementById('selectedServices');
  const timeSlotsList = document.getElementById('timeSlotsList');
  const selectedTimeInput = document.getElementById('selectedTime');
  const submitBtn = form.querySelector('button[type="submit"]');
  const dateInput = document.getElementById('date');

  // Validate required elements, list which ones are missing
  const missing = [];
  if (!selectedServicesInput) missing.push('#selectedServices (hidden input for services)');
  if (!selectedTimeInput) missing.push('#selectedTime (hidden input for time)');
  if (!submitBtn) missing.push('form button[type="submit"]');
  if (!dateInput) missing.push('#date (date input)');
  if (!timeSlotsList) console.warn('Optional: #timeSlotsList not found — time slots UI will not render.');
  if (missing.length) {
    console.error('One or more required elements are missing in the DOM:', missing.join(', '));
    // We choose to stop because critical inputs are missing and will cause runtime errors later.
    return;
  }

  // ====== SERVICE SELECTION ======
  // serviceItems may be empty (no selection UI) — handle gracefully
  if (serviceItems.length === 0) {
    console.warn('No .service-item elements found. Service selection UI will be disabled.');
  } else {
    serviceItems.forEach(item => {
      // guard in case of bizarre DOM mutation
      if (!item) return;
      item.addEventListener('click', () => {
        item.classList.toggle('selected');
        const selected = Array.from(document.querySelectorAll('.service-item.selected'))
                              .map(el => el.dataset.value)
                              .filter(Boolean);
        selectedServicesInput.value = selected.join(', ');
      });
    });
  }

  // ====== TIME SLOTS (9 AM to 6 PM, 2-hour gap) ======
  const timeSlots = [];
  for (let hour = 9; hour <= 17; hour += 2) {
    // Use fixed formatting to avoid locale surprises in parsing/storage
    const hh = String(hour).padStart(2, '0');
    timeSlots.push(`${hh}:00`);
  }

  function renderTimeSlots() {
    if (!timeSlotsList) return; // defensive
    timeSlotsList.innerHTML = '';
    timeSlots.forEach(time => {
      const div = document.createElement('div');
      div.className = 'time-slot';
      div.textContent = time;
      div.addEventListener('click', () => {
        document.querySelectorAll('.time-slot').forEach(slot => slot.classList.remove('selected'));
        div.classList.add('selected');
        selectedTimeInput.value = time;
      });
      timeSlotsList.appendChild(div);
    });
  }

  // Render only if container exists
  if (timeSlotsList) renderTimeSlots();

  // ====== MESSAGE HELPERS ======
  function showMessage(msg, type = 'error') {
    let el = form.querySelector('.form-message');
    if (!el) {
      el = document.createElement('div');
      el.className = 'form-message';
      el.style.marginTop = '0.5rem';
      // insert just before submit button if available, otherwise append
      if (submitBtn && submitBtn.parentNode) form.insertBefore(el, submitBtn);
      else form.appendChild(el);
    }
    el.textContent = msg;
    el.style.color = type === 'error' ? '#b00020' : '#006400';
  }

  function clearMessage() {
    const el = form.querySelector('.form-message');
    if (el) el.remove();
  }

  // ----- Utility: safe getter that doesn't crash if element missing (returns empty string) -----
  function safeValue(id) {
    const el = document.getElementById(id);
    return el ? String(el.value || '').trim() : '';
  }

  // ====== FORM SUBMIT ======
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearMessage();

    // Build payload using safeValue for resilience
    const payload = {
      name: safeValue('name'),
      email: safeValue('email'),
      phone: safeValue('phone'),
      services: safeValue('selectedServices'),
      bedrooms: safeValue('bedrooms'),
      bathrooms: safeValue('bathrooms'),
      garden: safeValue('garden'),
      garage: safeValue('garage'),
      address1: safeValue('address1'),
      address2: safeValue('address2'),
      city: safeValue('city'),
      country: safeValue('country'),
      postcode: safeValue('postcode'),
      furnished: safeValue('furnished'),
      additional: safeValue('additional'),
      keysCollect: safeValue('keysCollect'),
      keysReturn: safeValue('keysReturn'),
      date: dateInput.value || '',
      time: safeValue('selectedTime'),
      notes: safeValue('notes')
    };

    // ====== BASIC VALIDATION ======
    if (!payload.name) return showMessage('Please enter your full name.');
    if (!payload.email.includes('@')) return showMessage('Please enter a valid email address.');
    const phoneDigits = payload.phone.replace(/\s+/g, '');
    if (!/^0\d{10}$/.test(phoneDigits)) return showMessage('Enter a valid UK mobile number (11 digits, starts with 0).');
    if (!payload.services) return showMessage('Please select at least one service.');
    if (!payload.date) return showMessage('Please select a preferred date.');
    if (!payload.time) return showMessage('Please select a time slot.');

    // Disable submit UI
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Booking...';
    }

    try {
      const res = await fetch(WEB_APP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        // Try to extract server message if any
        let text = await res.text().catch(() => '');
        throw new Error(`Network/server error ${res.status}${text ? ': ' + text : ''}`);
      }

      showMessage('Booking confirmed successfully!', 'success');

      // Reset form + UI
      form.reset();
      document.querySelectorAll('.service-item.selected, .time-slot.selected').forEach(el => el.classList.remove('selected'));
      if (selectedServicesInput) selectedServicesInput.value = '';
      if (selectedTimeInput) selectedTimeInput.value = '';
      if (timeSlotsList) renderTimeSlots();

    } catch (err) {
      console.error('Submit error:', err);
      showMessage('Failed to submit booking. Please try again later.');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Confirm Booking';
      }
    }
  });
});
