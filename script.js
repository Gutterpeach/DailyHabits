let habits = JSON.parse(localStorage.getItem('daily_habits')) || [];
let selectedEmoji = '🌙';
let selectedDays = [];
let activeTab = 'all'; 

// Active selected date state
let selectedDate = new Date();

const activeHabitList = document.getElementById('active-habit-list');
const completedHabitList = document.getElementById('completed-habit-list');
const completedSection = document.getElementById('completed-section');

const dateDisplayLabel = document.getElementById('date-display-label');
const prevDateBtn = document.getElementById('prev-date-btn');
const nextDateBtn = document.getElementById('next-date-btn');
const todayShortcutBtn = document.getElementById('today-shortcut-btn');

const modal = document.getElementById('habit-modal');
const modalTitle = document.getElementById('modal-title');
const editHabitIdInput = document.getElementById('edit-habit-id');
const openModalBtn = document.getElementById('open-modal-btn');
const cancelBtn = document.getElementById('cancel-btn');
const saveHabitBtn = document.getElementById('save-habit-btn');
const deleteHabitBtn = document.getElementById('delete-habit-btn');

const nameInput = document.getElementById('habit-name');
const targetInput = document.getElementById('habit-target');
const freqSelect = document.getElementById('habit-freq');
const daySelector = document.getElementById('day-selector');
const dayBtns = document.querySelectorAll('.day-opt');
const emojiOptions = document.querySelectorAll('.emoji-opt');

const tabBtns = document.querySelectorAll('.tab-btn');

// --- Time-frame Helpers (Dynamic to selectedDate) ---
function getDailyKey(targetDate = selectedDate) {
  const year = targetDate.getFullYear();
  const month = String(targetDate.getMonth() + 1).padStart(2, '0');
  const day = String(targetDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`; // "YYYY-MM-DD"
}

function getWeeklyKey(targetDate = selectedDate) {
  const d = new Date(targetDate.getTime());
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getFullYear()}-W${weekNo}`; // "YYYY-W35"
}

function getMonthlyKey(targetDate = selectedDate) {
  const year = targetDate.getFullYear();
  const month = String(targetDate.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`; // "YYYY-MM"
}

function getHabitLogKey(habit, targetDate = selectedDate) {
  if (habit.frequency === 'weekly') return getWeeklyKey(targetDate);
  if (habit.frequency === 'monthly') return getMonthlyKey(targetDate);
  return getDailyKey(targetDate);
}

function isToday(date) {
  const today = new Date();
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
}

function updateDateHeader() {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  if (isToday(selectedDate)) {
    dateDisplayLabel.textContent = 'Today';
    todayShortcutBtn.classList.add('hidden');
  } else if (
    selectedDate.getDate() === yesterday.getDate() &&
    selectedDate.getMonth() === yesterday.getMonth() &&
    selectedDate.getFullYear() === yesterday.getFullYear()
  ) {
    dateDisplayLabel.textContent = 'Yesterday';
    todayShortcutBtn.classList.remove('hidden');
  } else if (
    selectedDate.getDate() === tomorrow.getDate() &&
    selectedDate.getMonth() === tomorrow.getMonth() &&
    selectedDate.getFullYear() === tomorrow.getFullYear()
  ) {
    dateDisplayLabel.textContent = 'Tomorrow';
    todayShortcutBtn.classList.remove('hidden');
  } else {
    const options = { weekday: 'short', day: 'numeric', month: 'short' };
    dateDisplayLabel.textContent = selectedDate.toLocaleDateString('en-GB', options);
    todayShortcutBtn.classList.remove('hidden');
  }
}

function saveToStorage() {
  localStorage.setItem('daily_habits', JSON.stringify(habits));
}

function getTodayProgress(habit) {
  if (!habit.logs) habit.logs = {};
  const key = getHabitLogKey(habit);
  return habit.logs[key] || 0;
}

function getFrequencyLabel(habit) {
  if (habit.frequency === 'daily') return 'Daily';
  if (habit.frequency === 'weekly') return 'Weekly';
  if (habit.frequency === 'monthly') return 'Monthly';
  if (habit.frequency === 'specific') {
    return habit.days && habit.days.length ? habit.days.join(', ') : 'Specific days';
  }
  return '';
}

function selectEmoji(emojiChar) {
  selectedEmoji = emojiChar;
  emojiOptions.forEach(opt => {
    if (opt.textContent.trim() === emojiChar) {
      opt.classList.add('selected');
    } else {
      opt.classList.remove('selected');
    }
  });
}

function resetForm() {
  editHabitIdInput.value = '';
  modalTitle.textContent = 'New Habit';
  nameInput.value = '';
  targetInput.value = '1';
  freqSelect.value = 'daily';
  daySelector.classList.add('hidden');
  selectedDays = [];
  dayBtns.forEach(b => b.classList.remove('selected'));
  selectEmoji('🌙');
  deleteHabitBtn.classList.add('hidden');
}

function openEditModal(index) {
  const habit = habits[index];
  if (!habit) return;

  editHabitIdInput.value = index;
  modalTitle.textContent = 'Edit Habit';
  nameInput.value = habit.name;
  targetInput.value = habit.target || 1;
  freqSelect.value = habit.frequency || 'daily';

  if (habit.frequency === 'specific') {
    daySelector.classList.remove('hidden');
    selectedDays = habit.days ? [...habit.days] : [];
    dayBtns.forEach(btn => {
      const day = btn.getAttribute('data-day');
      if (selectedDays.includes(day)) {
        btn.classList.add('selected');
      } else {
        btn.classList.remove('selected');
      }
    });
  } else {
    daySelector.classList.add('hidden');
    selectedDays = [];
    dayBtns.forEach(b => b.classList.remove('selected'));
  }

  selectEmoji(habit.icon || '🌙');
  deleteHabitBtn.classList.remove('hidden');
  modal.classList.remove('hidden');
}

function renderHabits() {
  updateDateHeader();
  activeHabitList.innerHTML = '';
  completedHabitList.innerHTML = '';

  let activeCount = 0;
  let completedCount = 0;

  habits.forEach((habit, index) => {
    // Filter by frequency tab
    if (activeTab === 'daily' && habit.frequency !== 'daily' && habit.frequency !== 'specific') return;
    if (activeTab === 'weekly' && habit.frequency !== 'weekly') return;
    if (activeTab === 'monthly' && habit.frequency !== 'monthly') return;

    const target = habit.target || 1;
    const currentProgress = getTodayProgress(habit);
    const isCompleted = currentProgress >= target;

    const card = document.createElement('div');
    card.className = `habit-card ${isCompleted ? 'completed-card' : ''}`;
    card.id = `habit-card-${index}`;

    let btnContent = '✓';
    if (target > 1) {
      btnContent = isCompleted ? '✓' : `${currentProgress}/${target}`;
    }

    card.innerHTML = `
      <div class="habit-info">
        <span class="habit-icon">${habit.icon}</span>
        <div class="habit-details">
          <h3>${habit.name}</h3>
          <p>🔥 ${habit.streak || 0} streak • ${getFrequencyLabel(habit)}</p>
        </div>
      </div>
      <div class="habit-actions-wrapper">
        <button class="edit-btn" onclick="openEditModal(${index})">✏️</button>
        <button class="checkbox-btn ${isCompleted ? 'completed' : ''}" onclick="toggleHabit(${index})">
          ${btnContent}
        </button>
      </div>
    `;

    if (isCompleted) {
      completedHabitList.appendChild(card);
      completedCount++;
    } else {
      activeHabitList.appendChild(card);
      activeCount++;
    }
  });

  if (activeCount === 0 && completedCount === 0) {
    activeHabitList.innerHTML = `<p style="text-align: center; color: #FFFFFF;">No habits found for this section!</p>`;
  }

  if (completedCount > 0) {
    completedSection.classList.remove('hidden');
  } else {
    completedSection.classList.add('hidden');
  }
}

function toggleHabit(index) {
  const habit = habits[index];
  if (!habit.logs) habit.logs = {};
  if (!habit.completedDates) habit.completedDates = [];

  const logKey = getHabitLogKey(habit);
  const target = habit.target || 1;
  let currentProgress = habit.logs[logKey] || 0;
  const wasCompleted = currentProgress >= target;

  if (wasCompleted) {
    habit.logs[logKey] = 0;
    if (habit.completedDates.includes(logKey)) {
      habit.completedDates = habit.completedDates.filter(d => d !== logKey);
      habit.streak = Math.max(0, (habit.streak || 0) - 1);
    }
    saveToStorage();
    renderHabits();
  } else {
    currentProgress += 1;
    habit.logs[logKey] = currentProgress;

    if (currentProgress >= target) {
      if (!habit.completedDates.includes(logKey)) {
        habit.completedDates.push(logKey);
        
        // Increment streak if updating today or a past date
        habit.streak = (habit.streak || 0) + 1;
      }

      const card = document.getElementById(`habit-card-${index}`);
      if (card) {
        card.classList.add('slide-out');
        setTimeout(() => {
          saveToStorage();
          renderHabits();
        }, 300);
        return;
      }
    }

    saveToStorage();
    renderHabits();
  }
}

// Date Navigation Listeners
prevDateBtn.addEventListener('click', () => {
  selectedDate.setDate(selectedDate.getDate() - 1);
  renderHabits();
});

nextDateBtn.addEventListener('click', () => {
  selectedDate.setDate(selectedDate.getDate() + 1);
  renderHabits();
});

todayShortcutBtn.addEventListener('click', () => {
  selectedDate = new Date();
  renderHabits();
});

// Tab Switching Listener
tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    tabBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeTab = btn.getAttribute('data-tab');
    renderHabits();
  });
});

// Frequency Select Handler
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

// Emoji selection
emojiOptions.forEach(opt => {
  opt.addEventListener('click', () => {
    selectEmoji(opt.textContent.trim());
  });
});

// Modal controls
openModalBtn.addEventListener('click', () => {
  resetForm();
  modal.classList.remove('hidden');
});

cancelBtn.addEventListener('click', () => {
  modal.classList.add('hidden');
  resetForm();
});

// Delete Habit Handler
deleteHabitBtn.addEventListener('click', () => {
  const editIndex = editHabitIdInput.value;
  if (editIndex !== '') {
    habits.splice(parseInt(editIndex, 10), 1);
    saveToStorage();
    renderHabits();
    modal.classList.add('hidden');
    resetForm();
  }
});

// Save Habit Handler
saveHabitBtn.addEventListener('click', () => {
  if (!nameInput.value.trim()) return;

  const targetVal = parseInt(targetInput.value, 10) || 1;
  const editIndex = editHabitIdInput.value;

  if (editIndex !== '') {
    const index = parseInt(editIndex, 10);
    habits[index] = {
      ...habits[index],
      name: nameInput.value.trim(),
      icon: selectedEmoji,
      frequency: freqSelect.value,
      days: [...selectedDays],
      target: targetVal
    };
  } else {
    const newHabit = {
      name: nameInput.value.trim(),
      icon: selectedEmoji,
      frequency: freqSelect.value,
      days: [...selectedDays],
      target: targetVal,
      streak: 0,
      completedDates: [],
      logs: {}
    };
    habits.push(newHabit);
  }

  saveToStorage();
  renderHabits();

  modal.classList.add('hidden');
  resetForm();
});

// Initial Render
renderHabits();
