let habits = JSON.parse(localStorage.getItem('daily_habits')) || [];
let selectedEmoji = '🌙';
let selectedDays = [];

const activeHabitList = document.getElementById('active-habit-list');
const completedHabitList = document.getElementById('completed-habit-list');
const completedSection = document.getElementById('completed-section');

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

const todayStr = new Date().toISOString().split('T')[0];

function saveToStorage() {
  localStorage.setItem('daily_habits', JSON.stringify(habits));
}

function getTodayProgress(habit) {
  if (!habit.logs) habit.logs = {};
  return habit.logs[todayStr] || 0;
}

function getFrequencyLabel(habit) {
  if (habit.frequency === 'daily') return 'Daily';
  if (habit.frequency === 'weekly') return 'Weekly';
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
  activeHabitList.innerHTML = '';
  completedHabitList.innerHTML = '';

  let activeCount = 0;
  let completedCount = 0;

  habits.forEach((habit, index) => {
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
          <p>🔥 ${habit.streak || 0} day streak • ${getFrequencyLabel(habit)}</p>
        </div>
      </div>
      <div class="habit-actions-wrapper">
        <button class="edit-btn" onclick="openEditModal(${index})" title="Edit Habit">✏️</button>
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
    activeHabitList.innerHTML = `<p style="text-align: center; color: #FFFFFF;">No habits yet! Tap + to add one.</p>`;
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

  const target = habit.target || 1;
  let currentProgress = habit.logs[todayStr] || 0;
  const wasCompleted = currentProgress >= target;

  if (wasCompleted) {
    habit.logs[todayStr] = 0;
    if (habit.completedDates.includes(todayStr)) {
      habit.completedDates = habit.completedDates.filter(d => d !== todayStr);
      habit.streak = Math.max(0, (habit.streak || 0) - 1);
    }
    saveToStorage();
    renderHabits();
  } else {
    currentProgress += 1;
    habit.logs[todayStr] = currentProgress;

    if (currentProgress >= target) {
      if (!habit.completedDates.includes(todayStr)) {
        habit.completedDates.push(todayStr);
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

// Save Habit Handler (Handles both Create and Edit)
saveHabitBtn.addEventListener('click', () => {
  if (!nameInput.value.trim()) return;

  const targetVal = parseInt(targetInput.value, 10) || 1;
  const editIndex = editHabitIdInput.value;

  if (editIndex !== '') {
    // Update existing habit
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
    // Add new habit
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
