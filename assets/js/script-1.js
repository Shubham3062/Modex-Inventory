document.addEventListener('DOMContentLoaded', () => {
  const WEB_APP_URL =
    'https://script.google.com/macros/s/AKfycbxfr9NVrEoGqvzdlh8BLlThz_0v4TCQncv-EV_0GNVYzTpfH-0rJ6P_EycnqApX6IzR/exec';

  const form = document.getElementById('bookingForm');
  const serviceItems = document.querySelectorAll('.service-item');
  const selectedServicesInput = document.getElementById('selectedServices');
  const timeSlotsList = document.getElementById('timeSlotsList');
  const selectedTimeInput = document.getElementById('selectedTime');
  const submitBtn = form.querySelector('button[type="submit"]');
  const dateInput = document.getElementById('date'); // <-- make sure it exists

  if (
    !form ||
    !serviceItems ||
    !selectedServicesInput ||
    !timeSlotsList ||
    !selectedTimeInput ||
    !submitBtn ||
    !dateInput
  ) {
    console.error('One or more required elements are missing in the DOM.');
    return;
  }

  // ====== SERVICE SELECTION ======
  serviceItems.forEach((item) => {
    item.addEventListener('click', () => {
      item.classList.toggle('selected');
      const selected = Array.from(
        document.querySelectorAll('.service-item.selected')
      ).map((el) => el.dataset.value);
      selectedServicesInput.value = selected.join(', ');
    });
  });

  // ====== TIME SLOTS (9 AM to 6 PM, 2-hour gap) ======
  const timeSlots = [];
  for (let hour = 9; hour <= 17; hour += 2) {
    const timeStr = new Date(0, 0, 0, hour).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
    timeSlots.push(timeStr);
  }

  function renderTimeSlots() {
    timeSlotsList.innerHTML = '';
    timeSlots.forEach((time) => {
      const div = document.createElement('div');
      div.className = 'time-slot';
      div.textContent = time;
      div.addEventListener('click', () => {
        document.querySelectorAll('.time-slot').forEach((slot) =>
          slot.classList.remove('selected')
        );
        div.classList.add('selected');
        selectedTimeInput.value = time;
      });
      timeSlotsList.appendChild(div);
    });
  }

  renderTimeSlots();

  // ====== MESSAGE HELPERS ======
  function showMessage(msg, type = 'error') {
    let el = form.querySelector('.form-message');
    if (!el) {
      el = document.createElement('div');
      el.className = 'form-message';
      el.style.marginTop = '0.5rem';
      form.insertBefore(el, submitBtn);
    }
    el.textContent = msg;
    el.style.color = type === 'error' ? '#b00020' : '#006400';
  }

  function clearMessage() {
    const el = form.querySelector('.form-message');
    if (el) el.remove();
  }

  // ====== FORM SUBMIT ======
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearMessage();

    const payload = {
      name: document.getElementById('name').value.trim(),
      email: document.getElementById('email').value.trim(),
      phone: document.getElementById('phone').value.trim(),
      services: selectedServicesInput.value,
      bedrooms: document.getElementById('bedrooms').value,
      bathrooms: document.getElementById('bathrooms').value,
      garden: document.getElementById('garden').value,
      garage: document.getElementById('garage').value,
      address1: document.getElementById('address1').value,
      address2: document.getElementById('address2').value,
      city: document.getElementById('city').value,
      country: document.getElementById('country').value,
      postcode: document.getElementById('postcode').value,
      furnished: document.getElementById('furnished').value,
      additional: document.getElementById('additional').value,
      keysCollect: document.getElementById('keysCollect').value,
      keysReturn: document.getElementById('keysReturn').value,
      date: dateInput.value,
      time: selectedTimeInput.value,
      notes: document.getElementById('notes').value.trim()
    };

    // ====== BASIC VALIDATION ======
    if (!payload.name) return showMessage('Please enter your full name.');
    if (!payload.email.includes('@'))
      return showMessage('Please enter a valid email address.');
    if (!/^0\d{10}$/.test(payload.phone.replace(/\s+/g, '')))
      return showMessage(
        'Enter a valid UK mobile number (11 digits, starts with 0).'
      );
    if (!payload.services) return showMessage('Please select at least one service.');
    if (!payload.date) return showMessage('Please select a preferred date.');
    if (!payload.time) return showMessage('Please select a time slot.');

    submitBtn.disabled = true;
    submitBtn.textContent = 'Booking...';

    try {
      const res = await fetch(WEB_APP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Network error or invalid server response.');

      showMessage('Booking confirmed successfully!', 'success');
      form.reset();
      document
        .querySelectorAll('.service-item, .time-slot')
        .forEach((el) => el.classList.remove('selected'));
      selectedServicesInput.value = '';
      selectedTimeInput.value = '';
      renderTimeSlots(); // re-render slots after reset
    } catch (err) {
      console.error(err);
      showMessage('Failed to submit booking. Please try again later.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Confirm Booking';
    }
  });
});