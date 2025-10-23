document.addEventListener('DOMContentLoaded', () => {
  const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzMLR6UlW0lzYs-SU76Sk3pFsky8lillRaTaCXcVgpoLdMKr9j-ydWEwTvnfCUkaDdz/exec';

  // ====== SELECT ELEMENTS SAFELY ======
  const getEl = (id) => {
    const el = document.getElementById(id);
    if (!el) console.warn(`Element with id "${id}" not found`);
    return el;
  };

  const form = getEl('bookingForm');
  const serviceItems = document.querySelectorAll('.service-item');
  const selectedServicesInput = getEl('selectedServices');
  const timeSlotsList = getEl('timeSlotsList');
  const selectedTimeInput = getEl('selectedTime');
  const submitBtn = form ? form.querySelector('button[type="submit"]') : null;
  const dateInput = getEl('date');

  // Stop if critical elements are missing
  if (!form || !selectedServicesInput || !timeSlotsList || !selectedTimeInput || !submitBtn || !dateInput) {
    console.error('Critical form elements missing. Cannot initialize booking form.');
    return;
  }

// ====== SERVICE SELECTION ======
serviceItems.forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault(); // prevent default if item is a button or link
    item.classList.toggle('selected'); // toggle selection
    // collect all selected service values
    const selected = Array.from(serviceItems)
      .filter(el => el.classList.contains('selected'))
      .map(el => el.dataset.value);
    selectedServicesInput.value = selected.join(', ');
  });
});


  // ====== TIME SLOTS (9 AM to 6 PM, 2-hour gap) ======
  const timeSlots = [];
  for (let hour = 9; hour <= 17; hour += 2) {
    const timeStr = new Date(0, 0, 0, hour).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    timeSlots.push(timeStr);
  }

  const renderTimeSlots = () => {
    if (!timeSlotsList) return;
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
  };

  renderTimeSlots();

  // ====== MESSAGE HELPERS ======
  const showMessage = (msg, type = 'error') => {
    let el = form.querySelector('.form-message');
    if (!el) {
      el = document.createElement('div');
      el.className = 'form-message';
      el.style.marginTop = '0.5rem';
      form.insertBefore(el, submitBtn);
    }
    el.textContent = msg;
    el.style.color = type === 'error' ? '#b00020' : '#006400';
  };

  const clearMessage = () => {
    const el = form.querySelector('.form-message');
    if (el) el.remove();
  };

  // ====== FORM SUBMIT ======
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearMessage();

      const payload = {
        name: getEl('name')?.value.trim() || '',
        email: getEl('email')?.value.trim() || '',
        phone: getEl('phone')?.value.trim() || '',
        services: selectedServicesInput.value,
        bedrooms: getEl('bedrooms')?.value || '',
        bathrooms: getEl('bathrooms')?.value || '',
        garden: getEl('garden')?.value || '',
        garage: getEl('garage')?.value || '',
        address1: getEl('address1')?.value || '',
        address2: getEl('address2')?.value || '',
        city: getEl('city')?.value || '',
        country: getEl('country')?.value || '',
        postcode: getEl('postcode')?.value || '',
        furnished: getEl('furnished')?.value || '',
        additional: getEl('additional')?.value || '',
        keysCollect: getEl('keysCollect')?.value || '',
        keysReturn: getEl('keysReturn')?.value || '',
        date: dateInput.value,
        time: selectedTimeInput.value,
        notes: getEl('notes')?.value.trim() || ''
      };

      // ====== BASIC VALIDATION ======
      if (!payload.name) return showMessage('Please enter your full name.');
      if (!payload.email.includes('@')) return showMessage('Please enter a valid email address.');
      if (!/^0\d{10}$/.test(payload.phone.replace(/\s+/g, ''))) return showMessage('Enter a valid UK mobile number (11 digits, starts with 0).');
      if (!payload.services) return showMessage('Please select at least one service.');
      if (!payload.date) return showMessage('Please select a preferred date.');
      if (!payload.time) return showMessage('Please select a time slot.');

      submitBtn.disabled = true;
      submitBtn.textContent = 'Booking...';

      console.log('Submitting payload:', payload);

      try {
        const res = await fetch(WEB_APP_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error(`Network error or invalid server response: ${res.status}`);

        const result = await res.json();
        console.log('Server response:', result);

        showMessage('Booking confirmed successfully!', 'success');
        form.reset();
        document.querySelectorAll('.service-item, .time-slot').forEach(el => el.classList.remove('selected'));
        selectedServicesInput.value = '';
        selectedTimeInput.value = '';
        renderTimeSlots();

      } catch (err) {
        console.error('Submit error:', err);
        showMessage('Failed to submit booking. Please try again later.');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Confirm Booking';
      }
    });
  }
});
