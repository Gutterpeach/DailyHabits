if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js');
}
let habits = JSON.parse(localStorage.getItem('daily_habits')) || [];
let selectedEmoji = '🌙';
let selectedDays = [];
let editingHabitIndex = null;

const habitList = document.getElementById('habit-list');
const modal = document.getElementById('habit-modal');
const modalTitle = document.getElementById('modal-title');
const openModalBtn = document.getElementById('open-modal-btn');
const cancelBtn = document.getElementById('cancel-btn');
const saveHabitBtn = document.getElementById('save-habit-btn');
const freqSelect = document.getElementById('habit-freq');
const daySelector = document.getElementById('day-selector');
const dayBtns = document.querySelectorAll('.day-opt');
const nameInput = document.getElementById('habit-name');

const todayStr = new Date().toISOString().split('T')[0];

function saveToStorage() {
  localStorage.setItem('daily_habits', JSON.stringify(habits));
}

function getFrequencyLabel(habit) {
  if (habit.frequency === 'daily') return 'Daily';
  if (habit.frequency === 'weekly') return 'Weekly';
  if (habit.frequency === 'specific') {
    return habit.days.length ? habit.days.join(', ') : 'Specific days';
  }
  return '';
}

function renderHabits() {
  habitList.innerHTML = '';
  
  if (habits.length === 0) {
    habitList.innerHTML = `<p style="text-align: center; color: #FFFFFF;">No habits yet! Tap + to add one.</p>`;
    return;
  }

  habits.forEach((habit, index) => {
    const isCompletedToday = habit.completedDates.includes(todayStr);

    const card = document.createElement('div');
    card.className = 'habit-card';
    card.innerHTML = `
      <div class="habit-info">
        <span class="habit-icon">${habit.icon}</span>
        <div class="habit-details">
          <h3>${habit.name}</h3>
          <p>🔥 ${habit.streak} day streak • ${getFrequencyLabel(habit)}</p>
        </div>
      </div>
      <div class="habit-actions">
        <button class="action-btn" title="Edit" onclick="editHabit(${index})">✏️</button>
        <button class="action-btn" title="Delete" onclick="deleteHabit(${index})">🗑️</button>
        <button class="checkbox-btn ${isCompletedToday ? 'completed' : ''}" onclick="toggleHabit(${index})">
          ${isCompletedToday ? '✓' : ''}
        </button>
      </div>
    `;
    habitList.appendChild(card);
  });
}

// Toggle/Uncheck Habit
function toggleHabit(index) {
  const habit = habits[index];
  const dateIndex = habit.completedDates.indexOf(todayStr);

  if (dateIndex > -1) {
    // Uncheck habit if already checked today
    habit.completedDates.splice(dateIndex, 1);
    habit.streak = Math.max(0, habit.streak - 1);
  } else {
    // Check habit
    habit.completedDates.push(todayStr);
    habit.streak += 1;
  }

  saveToStorage();
  renderHabits();
}

// Delete Habit
function deleteHabit(index) {
  if (confirm(`Are you sure you want to delete "${habits[index].name}"?`)) {
    habits.splice(index, 1);
    saveToStorage();
    renderHabits();
  }
}

// Edit Habit Modal Setup
function editHabit(index) {
  editingHabitIndex = index;
  const habit = habits[index];

  modalTitle.textContent = 'Edit Habit';
  nameInput.value = habit.name;
  freqSelect.value = habit.frequency;
  selectedDays = [...(habit.days || [])];

  // Highlight days
  dayBtns.forEach(btn => {
    const day = btn.getAttribute('data-day');
    if (selectedDays.includes(day)) {
      btn.classList.add('selected');
    } else {
      btn.classList.remove('selected');
    }
  });

  if (habit.frequency === 'specific') {
    daySelector.classList.remove('hidden');
  } else {
    daySelector.classList.add('hidden');
  }

  // Highlight selected emoji
  selectedEmoji = habit.icon;
  document.querySelectorAll('.emoji-opt').forEach(opt => {
    if (opt.textContent === selectedEmoji) {
      opt.classList.add('selected');
    } else {
      opt.classList.remove('selected');
    }
  });

  modal.classList.remove('hidden');
}

// Setup Emoji Selection
function setupEmojiPicker() {
  const emojiOptions = document.querySelectorAll('.emoji-opt');
  if (emojiOptions.length > 0) {
    selectedEmoji = emojiOptions[0].textContent;
  }
  emojiOptions.forEach(opt => {
    opt.addEventListener('click', () => {
      emojiOptions.forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      selectedEmoji = opt.textContent;
    });
  });
}

// Frequency Dropdown Handler
freqSelect.addEventListener('change', (e) => {
  if (e.target.value === 'specific') {
    daySelector.classList.remove('hidden');
  } else {
    daySelector.classList.add('hidden');
  }
});

// Day Selector Button Toggles
dayBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const day = btn.getAttribute('data-day');
    btn.classList.toggle('selected');
    
    if (selectedDays.includes(day)) {
      selectedDays = selectedDays.filter(d => d !== day);
    } else {
      selectedDays.push(day);
    }
  });
});

// Modal controls
openModalBtn.addEventListener('click', () => {
  editingHabitIndex = null;
  modalTitle.textContent = 'New Habit';
  nameInput.value = '';
  selectedDays = [];
  dayBtns.forEach(b => b.classList.remove('selected'));
  freqSelect.value = 'daily';
  daySelector.classList.add('hidden');
  modal.classList.remove('hidden');
});

cancelBtn.addEventListener('click', () => modal.classList.add('hidden'));

saveHabitBtn.addEventListener('click', () => {
  if (!nameInput.value.trim()) return;

  if (editingHabitIndex !== null) {
    // Update existing habit
    habits[editingHabitIndex].name = nameInput.value.trim();
    habits[editingHabitIndex].icon = selectedEmoji;
    habits[editingHabitIndex].frequency = freqSelect.value;
    habits[editingHabitIndex].days = [...selectedDays];
  } else {
    // Create new habit
    const newHabit = {
      name: nameInput.value.trim(),
      icon: selectedEmoji,
      frequency: freqSelect.value,
      days: [...selectedDays],
      streak: 0,
      completedDates: []
    };
    habits.push(newHabit);
  }

  saveToStorage();
  renderHabits();

  // Reset & Hide Modal
  nameInput.value = '';
  selectedDays = [];
  editingHabitIndex = null;
  dayBtns.forEach(b => b.classList.remove('selected'));
  freqSelect.value = 'daily';
  daySelector.classList.add('hidden');
  modal.classList.add('hidden');
});

// Initial Setup & Render
setupEmojiPicker();
renderHabits();
