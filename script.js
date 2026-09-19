// --- DATA STORAGE & GLOBAL STATE ---
let habits = JSON.parse(localStorage.getItem('daily_habits')) || [];
let todos = JSON.parse(localStorage.getItem('daily_todos')) || [];
let idealDayData = JSON.parse(localStorage.getItem('ideal_day_data')) || {
  vision: '',
  photo: '',
  selectedHabits: []
};

let selectedEmoji = '🌙';
let selectedDays = [];
let activeTab = 'all'; 
let activeTodoTab = 'daily'; 

let selectedDate = new Date();

// --- DOM ELEMENTS: HABITS ---
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

// --- DOM ELEMENTS: NAVIGATION VIEWS ---
const navTabs = document.querySelectorAll('.nav-tab');
const tabViews = document.querySelectorAll('.tab-view');

// --- DOM ELEMENTS: TO-DO VIEW ---
const todoTypeBtns = document.querySelectorAll('.todo-type-btn');
const todoInput = document.getElementById('todo-input');
const addTodoBtn = document.getElementById('add-todo-btn');
const todoList = document.getElementById('todo-list');
const todoCompletedSection = document.getElementById('todo-completed-section');
const todoCompletedList = document.getElementById('todo-completed-list');

// --- DOM ELEMENTS: IDEAL DAY VIEW ---
const idealVisionText = document.getElementById('ideal-vision-text');
const idealPhotoInput = document.getElementById('ideal-photo-input');
const uploadPhotoBtn = document.getElementById('upload-photo-btn');
const removePhotoBtn = document.getElementById('remove-photo-btn');
const idealPhotoPreview = document.getElementById('ideal-photo-preview');
const idealPhotoImg = document.getElementById('ideal-photo-img');
const idealHabitChecklist = document.getElementById('ideal-habit-checklist');

// ==================== BOTTOM NAV VIEW SWITCHING ====================
function switchView(targetViewId) {
  navTabs.forEach(tab => {
    if (tab.getAttribute('data-view') === targetViewId) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });

  tabViews.forEach(view => {
    if (view.id === targetViewId) {
      view.classList.remove('hidden');
    } else {
      view.classList.add('hidden');
    }
  });

  if (targetViewId === 'view-ideal-day') {
    renderIdealDayView();
  } else if (targetViewId === 'view-todo') {
    renderTodos();
  } else if (targetViewId === 'view-habits') {
    renderHabits();
  }
}

navTabs.forEach(tab => {
  tab.addEventListener('click', (e) => {
    e.preventDefault();
    const targetViewId = tab.getAttribute('data-view');
    if (targetViewId) {
      switchView(targetViewId);
    }
  });
});

// ==================== HABITS MODULE ====================

function getDailyKey(targetDate = selectedDate) {
  const year = targetDate.getFullYear();
  const month = String(targetDate.getMonth() + 1).padStart(2, '0');
  const day = String(targetDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getWeeklyKey(targetDate = selectedDate) {
  const d = new Date(targetDate.getTime());
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getFullYear()}-W${weekNo}`;
}

function getMonthlyKey(targetDate = selectedDate) {
  const year = targetDate.getFullYear();
  const month = String(targetDate.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
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
  if (!dateDisplayLabel || !todayShortcutBtn) return;
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
  if (!editHabitIdInput) return;
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
  if (!activeHabitList || !completedHabitList) return;
  updateDateHeader();
  activeHabitList.innerHTML = '';
  completedHabitList.innerHTML = '';

  let activeCount = 0;
  let completedCount = 0;

  habits.forEach((habit, index) => {
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
          <h3>${escapeHtml(habit.name)}</h3>
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

// Habits Event Listeners
if (prevDateBtn) prevDateBtn.addEventListener('click', () => { selectedDate.setDate(selectedDate.getDate() - 1); renderHabits(); });
if (nextDateBtn) nextDateBtn.addEventListener('click', () => { selectedDate.setDate(selectedDate.getDate() + 1); renderHabits(); });
if (todayShortcutBtn) todayShortcutBtn.addEventListener('click', () => { selectedDate = new Date(); renderHabits(); });

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    tabBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeTab = btn.getAttribute('data-tab');
    renderHabits();
  });
});

if (freqSelect) {
  freqSelect.addEventListener('change', (e) => {
    if (e.target.value === 'specific') {
      daySelector.classList.remove('hidden');
    } else {
      daySelector.classList.add('hidden');
    }
  });
}

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

emojiOptions.forEach(opt => {
  opt.addEventListener('click', () => {
    selectEmoji(opt.textContent.trim());
  });
});

if (openModalBtn) openModalBtn.addEventListener('click', () => { resetForm(); modal.classList.remove('hidden'); });
if (cancelBtn) cancelBtn.addEventListener('click', () => { modal.classList.add('hidden'); resetForm(); });

if (deleteHabitBtn) {
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
}

if (saveHabitBtn) {
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
}

// ==================== TO-DO MODULE ====================

function saveTodos() {
  localStorage.setItem('daily_todos', JSON.stringify(todos));
}

function renderTodos() {
  if (!todoList || !todoCompletedList) return;
  todoList.innerHTML = '';
  todoCompletedList.innerHTML = '';

  let activeCount = 0;
  let completedCount = 0;

  todos.forEach((todo, index) => {
    if (todo.type !== activeTodoTab) return;

    const card = document.createElement('div');
    card.className = `todo-card ${todo.completed ? 'completed-card' : ''}`;
    card.id = `todo-card-${index}`;

    card.innerHTML = `
      <span class="todo-title" id="todo-text-${index}">${escapeHtml(todo.text)}</span>
      <div class="todo-actions-wrapper">
        <button class="edit-btn" onclick="startEditingTodo(${index})">✏️</button>
        <button class="delete-todo-btn" onclick="deleteTodo(${index})">🗑️</button>
        <button class="checkbox-btn ${todo.completed ? 'completed' : ''}" onclick="toggleTodo(${index})">
          ${todo.completed ? '✓' : ''}
        </button>
      </div>
    `;

    if (todo.completed) {
      todoCompletedList.appendChild(card);
      completedCount++;
    } else {
      todoList.appendChild(card);
      activeCount++;
    }
  });

  if (activeCount === 0 && completedCount === 0) {
    todoList.innerHTML = `<p style="text-align: center; color: #FFFFFF;">No ${activeTodoTab} tasks yet!</p>`;
  }

  if (completedCount > 0) {
    todoCompletedSection.classList.remove('hidden');
  } else {
    todoCompletedSection.classList.add('hidden');
  }
}

function addTodo() {
  if (!todoInput) return;
  const text = todoInput.value.trim();
  if (!text) return;

  todos.push({
    id: Date.now(),
    text: text,
    type: activeTodoTab,
    completed: false
  });

  todoInput.value = '';
  saveTodos();
  renderTodos();
}

function toggleTodo(index) {
  todos[index].completed = !todos[index].completed;
  saveTodos();
  renderTodos();
}

function deleteTodo(index) {
  todos.splice(index, 1);
  saveTodos();
  renderTodos();
}

function startEditingTodo(index) {
  const textSpan = document.getElementById(`todo-text-${index}`);
  if (!textSpan) return;

  const currentText = todos[index].text;
  textSpan.innerHTML = `
    <input type="text" class="todo-edit-input" id="edit-todo-input-${index}" value="${escapeHtml(currentText)}" />
  `;

  const input = document.getElementById(`edit-todo-input-${index}`);
  if (input) {
    input.focus();
    const saveEdit = () => {
      const updatedText = input.value.trim();
      if (updatedText) {
        todos[index].text = updatedText;
        saveTodos();
      }
      renderTodos();
    };

    input.addEventListener('blur', saveEdit);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') saveEdit();
    });
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

todoTypeBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    todoTypeBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeTodoTab = btn.getAttribute('data-todo-type');
    renderTodos();
  });
});

if (addTodoBtn) addTodoBtn.addEventListener('click', addTodo);
if (todoInput) {
  todoInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addTodo();
  });
}

// ==================== IDEAL DAY MODULE ====================

function saveIdealDayData() {
  localStorage.setItem('ideal_day_data', JSON.stringify(idealDayData));
}

function renderIdealDayView() {
  if (!idealVisionText || !idealHabitChecklist) return;

  idealVisionText.value = idealDayData.vision || '';

  if (idealDayData.photo && idealPhotoImg) {
    idealPhotoImg.src = idealDayData.photo;
    idealPhotoPreview.classList.remove('hidden');
    removePhotoBtn.classList.remove('hidden');
  } else {
    if (idealPhotoPreview) idealPhotoPreview.classList.add('hidden');
    if (removePhotoBtn) removePhotoBtn.classList.add('hidden');
  }

  idealHabitChecklist.innerHTML = '';
  if (habits.length === 0) {
    idealHabitChecklist.innerHTML = `<p style="color: #4E6B51; font-size: 13px;">No habits created yet! Add habits in the Habits tab first.</p>`;
    return;
  }

  habits.forEach((habit) => {
    const isChecked = (idealDayData.selectedHabits || []).includes(habit.name);
    const item = document.createElement('label');
    item.className = 'ideal-item';
    item.innerHTML = `
      <input type="checkbox" ${isChecked ? 'checked' : ''} onchange="toggleIdealHabit('${escapeHtml(habit.name)}')">
      <span>${habit.icon} ${escapeHtml(habit.name)}</span>
    `;
    idealHabitChecklist.appendChild(item);
  });
}

function toggleIdealHabit(habitName) {
  if (!idealDayData.selectedHabits) idealDayData.selectedHabits = [];
  
  if (idealDayData.selectedHabits.includes(habitName)) {
    idealDayData.selectedHabits = idealDayData.selectedHabits.filter(h => h !== habitName);
  } else {
    idealDayData.selectedHabits.push(habitName);
  }
  saveIdealDayData();
}

if (idealVisionText) {
  idealVisionText.addEventListener('input', () => {
    idealDayData.vision = idealVisionText.value;
    saveIdealDayData();
  });
}

if (uploadPhotoBtn) {
  uploadPhotoBtn.addEventListener('click', () => {
    if (idealPhotoInput) idealPhotoInput.click();
  });
}

if (idealPhotoInput) {
  idealPhotoInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(event) {
        idealDayData.photo = event.target.result;
        saveIdealDayData();
        renderIdealDayView();
      };
      reader.readAsDataURL(file);
    }
  });
}

if (removePhotoBtn) {
  removePhotoBtn.addEventListener('click', () => {
    idealDayData.photo = '';
    if (idealPhotoInput) idealPhotoInput.value = '';
    saveIdealDayData();
    renderIdealDayView();
  });
}

// ==================== INITIALIZATION ====================
renderHabits();
renderTodos();
renderIdealDayView();
