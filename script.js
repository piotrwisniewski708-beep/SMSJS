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

const storage = {
  people: 'family_people',
  reminders: 'family_reminders',
};

function load(key) {
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : [];
}

function save(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
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
      clone.querySelector('.message').textContent = reminder.message;
      clone.querySelector('.schedule').textContent = formatDate(reminder.date, reminder.time);
      clone.querySelector('button').addEventListener('click', () => deleteReminder(reminder.id));

      remindersContainer.appendChild(clone);
    });
}

function persistAndRender() {
  const people = load(storage.people);
  const reminders = load(storage.reminders);
  renderPeople(people);
  renderReminders(reminders, people);
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

renderDefaultDate();
persistAndRender();
