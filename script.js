const personForm = document.getElementById('personForm');
const reminderForm = document.getElementById('reminderForm');
const peopleList = document.getElementById('peopleList');
const personSelect = document.getElementById('person');
const filterPerson = document.getElementById('filterPerson');
const filterChannel = document.getElementById('filterChannel');
const remindersContainer = document.getElementById('reminders');
const reminderTemplate = document.getElementById('reminderTemplate');
const plannedCount = document.getElementById('plannedCount');
const resetData = document.getElementById('resetData');
const deliveryForm = document.getElementById('deliveryForm');
const deliveryMode = document.getElementById('deliveryMode');
const deliveryLogEl = document.getElementById('deliveryLog');

const storage = {
  people: 'family_people',
  reminders: 'family_reminders',
  settings: 'family_delivery_settings',
  logs: 'family_delivery_logs',
};

function load(key, fallback = []) {
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : fallback;
}

function save(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function loadSettings() {
  const defaults = { webhookUrl: '', authToken: '', simulate: true };
  return { ...defaults, ...load(storage.settings, {}) };
}

function loadLogs() {
  return load(storage.logs, []);
}

function saveLogs(logs) {
  save(storage.logs, logs.slice(-20));
}

function renderPeople(people) {
  peopleList.innerHTML = '';
  personSelect.innerHTML = '<option value="" disabled selected>Wybierz osobę</option>';
  filterPerson.innerHTML = '<option value="">Wszyscy odbiorcy</option>';

  people.forEach((p) => {
    const pill = document.createElement('div');
    pill.className = 'pill';
    pill.innerHTML = `<strong>${p.name}</strong><span>${p.email} · ${p.phone}</span>`;
    peopleList.appendChild(pill);

    const option = document.createElement('option');
    option.value = p.id;
    option.textContent = p.name;
    personSelect.appendChild(option);

    const filterOption = option.cloneNode(true);
    filterPerson.appendChild(filterOption);
  });
}

function formatDate(date, time) {
  return new Intl.DateTimeFormat('pl-PL', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(new Date(`${date}T${time}`));
}

function renderReminders(reminders, people) {
  remindersContainer.innerHTML = '';
  plannedCount.textContent = `${reminders.length} w kolejce`;

  const filters = {
    person: filterPerson.value,
    channel: filterChannel.value,
  };

  reminders
    .filter((reminder) => !filters.person || reminder.personId === filters.person)
    .filter((reminder) => !filters.channel || reminder.channel === filters.channel)
    .sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime))
    .forEach((reminder) => {
      const clone = reminderTemplate.content.cloneNode(true);
      const person = people.find((p) => p.id === reminder.personId);
      const personText = person ? `${person.name} (${person.email} · ${person.phone})` : 'Nieznana osoba';

      clone.querySelector('.person').textContent = personText;
      clone.querySelector('.channel').textContent = reminder.channel;
      const status = clone.querySelector('.status');
      status.textContent = reminder.status === 'sent' ? 'Wysłane' : reminder.status === 'error' ? 'Błąd' : 'W kolejce';
      status.className = `status ${reminder.status || 'pending'}`;
      clone.querySelector('.message').textContent = reminder.message;
      const schedule = clone.querySelector('.schedule');
      schedule.innerHTML = `<span>${formatDate(reminder.date, reminder.time)}</span>`;
      if (reminder.sentAt) {
        schedule.innerHTML += `<span class="meta">Wysłano: ${formatDate(reminder.sentAt.slice(0, 10), reminder.sentAt.slice(11, 16))}</span>`;
      }
      clone.querySelector('.delete').addEventListener('click', () => deleteReminder(reminder.id));
      clone.querySelector('.send').addEventListener('click', () => deliverReminder(reminder.id));

      remindersContainer.appendChild(clone);
    });
}

function persistAndRender() {
  const people = load(storage.people);
  const reminders = load(storage.reminders).map((r) => ({ status: 'pending', ...r }));
  renderPeople(people);
  renderReminders(reminders, people);
  renderLogs();
  renderSettings();
}

personForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const data = new FormData(personForm);
  const person = {
    id: crypto.randomUUID(),
    name: data.get('name').trim(),
    email: data.get('email').trim(),
    phone: data.get('phone').trim(),
  };

  if (!person.name || !person.email || !person.phone) return;
  const people = [...load(storage.people), person];
  save(storage.people, people);
  personForm.reset();
  persistAndRender();
});

reminderForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const data = new FormData(reminderForm);
  const reminder = {
    id: crypto.randomUUID(),
    personId: data.get('person'),
    channel: data.get('channel'),
    message: data.get('message').trim(),
    date: data.get('date'),
    time: data.get('time'),
    dateTime: `${data.get('date')}T${data.get('time')}`,
    status: 'pending',
  };

  if (!reminder.personId || !reminder.message || !reminder.date || !reminder.time) return;

  const reminders = [...load(storage.reminders), reminder];
  save(storage.reminders, reminders);
  reminderForm.reset();
  renderDefaultDate();
  persistAndRender();
});

function deleteReminder(id) {
  const reminders = load(storage.reminders).filter((r) => r.id !== id);
  save(storage.reminders, reminders);
  persistAndRender();
}

filterPerson.addEventListener('change', persistAndRender);
filterChannel.addEventListener('change', persistAndRender);
resetData.addEventListener('click', () => {
  if (confirm('Usunąć wszystkie osoby i przypomnienia?')) {
    localStorage.removeItem(storage.people);
    localStorage.removeItem(storage.reminders);
    localStorage.removeItem(storage.logs);
    localStorage.removeItem(storage.settings);
    persistAndRender();
  }
});

function renderDefaultDate() {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const in30min = new Date(now.getTime() + 30 * 60 * 1000)
    .toISOString()
    .split('T')[1]
    .slice(0, 5);
  reminderForm.querySelector('#date').value = today;
  reminderForm.querySelector('#time').value = in30min;
}

function renderSettings() {
  const settings = loadSettings();
  deliveryForm.webhookUrl.value = settings.webhookUrl;
  deliveryForm.authToken.value = settings.authToken;
  deliveryForm.simulate.checked = settings.simulate;
  deliveryMode.textContent = settings.simulate || !settings.webhookUrl ? 'Symulacja' : 'Webhook';
  deliveryMode.className = `chip ${settings.simulate || !settings.webhookUrl ? 'neutral' : 'success'}`;
}

deliveryForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const data = new FormData(deliveryForm);
  const settings = {
    webhookUrl: data.get('webhookUrl').trim(),
    authToken: data.get('authToken').trim(),
    simulate: Boolean(data.get('simulate')),
  };
  save(storage.settings, settings);
  renderSettings();
  alert('Zapisano ustawienia wysyłki');
});

function renderLogs() {
  const logs = loadLogs();
  deliveryLogEl.innerHTML = '';
  logs
    .slice()
    .reverse()
    .forEach((log) => {
      const item = document.createElement('div');
      item.className = `log-item ${log.status}`;
      item.innerHTML = `<div><strong>${log.person}</strong> • ${log.channel}</div><div>${log.message}</div><div class="meta">${formatDate(log.dateTime.slice(0, 10), log.dateTime.slice(11, 16))}</div><div class="meta">${log.info}</div>`;
      deliveryLogEl.appendChild(item);
    });
}

async function deliverReminder(reminderId) {
  const reminders = load(storage.reminders);
  const reminder = reminders.find((r) => r.id === reminderId);
  if (!reminder) return;

  const people = load(storage.people);
  const person = people.find((p) => p.id === reminder.personId);
  const settings = loadSettings();
  const payload = {
    person,
    reminder: {
      channel: reminder.channel,
      message: reminder.message,
      schedule: reminder.dateTime,
    },
  };

  let status = 'sent';
  let info = 'Wysłano w trybie symulacji (brak webhooka).';

  if (!settings.simulate && settings.webhookUrl) {
    try {
      const response = await fetch(settings.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(settings.authToken ? { Authorization: settings.authToken } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      info = 'Wysłano przez webhook.';
    } catch (error) {
      status = 'error';
      info = `Błąd wysyłki: ${error.message}`;
    }
  }

  const updated = reminders.map((r) =>
    r.id === reminder.id
      ? {
          ...r,
          status,
          sentAt: new Date().toISOString(),
        }
      : r
  );

  const logs = loadLogs();
  logs.push({
    person: person ? person.name : 'Nieznany',
    channel: reminder.channel,
    message: reminder.message,
    dateTime: reminder.dateTime,
    status,
    info,
  });

  save(storage.reminders, updated);
  saveLogs(logs);
  persistAndRender();
}

function autoDeliver() {
  const now = Date.now();
  const reminders = load(storage.reminders);
  reminders
    .filter((r) => r.status !== 'sent')
    .filter((r) => new Date(r.dateTime).getTime() <= now)
    .forEach((r) => deliverReminder(r.id));
}

renderDefaultDate();
persistAndRender();
renderSettings();
renderLogs();
autoDeliver();
setInterval(autoDeliver, 30000);
