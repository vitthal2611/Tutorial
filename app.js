'use strict';

(function () {
  const HABITS_KEY = 'habitTracker.habits';
  const COMPLETIONS_KEY = 'habitTracker.completions';

  const periodTitles = {
    daily: "Today's Habits",
    weekly: "This Week's Habits",
    monthly: "This Month's Habits",
    quarterly: "This Quarter's Habits",
    yearly: "This Year's Habits",
  };

  const periodLabels = {
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    yearly: 'Yearly',
  };

  const dashboardPeriods = ['daily', 'weekly', 'monthly', 'quarterly,', 'yearly'];

  /**
   * Data access
   */
  function loadHabits() {
    const raw = localStorage.getItem(HABITS_KEY);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
      return [];
    } catch (e) {
      console.error('Failed to parse habits', e);
      return [];
    }
  }

  function saveHabits(habits) {
    localStorage.setItem(HABITS_KEY, JSON.stringify(habits));
  }

  function loadCompletions() {
    const raw = localStorage.getItem(COMPLETIONS_KEY);
    if (!raw) return {};
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (e) {
      console.error('Failed to parse completions', e);
      return {};
    }
  }

  function saveCompletions(completions) {
    localStorage.setItem(COMPLETIONS_KEY, JSON.stringify(completions));
  }

  function generateHabitId() {
    return 'h_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
  }

  /**
   * Time and period utilities
   */
  function parseTimeToMinutes(time) {
    if (!time) return 0;
    const [hh, mm] = time.split(':').map(Number);
    if (Number.isNaN(hh) || Number.isNaN(mm)) return 0;
    return hh * 60 + mm;
  }

  function formatTimeDisplay(time) {
    if (!time) return '';
    const [hh, mm] = time.split(':').map(Number);
    const ampm = hh >= 12 ? 'PM' : 'AM';
    const hour12 = hh % 12 === 0 ? 12 : hh % 12;
    const mmStr = String(mm).padStart(2, '0');
    return `${hour12}:${mmStr} ${ampm}`;
  }

  function getToday() {
    return new Date();
  }

  function pad2(num) {
    return String(num).padStart(2, '0');
  }

  function getISOWeek(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    // Thursday in current week decides the year.
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNumber = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return { year: d.getUTCFullYear(), week: weekNumber };
  }

  function getQuarter(date) {
    return Math.floor(date.getMonth() / 3) + 1; // 1-4
  }

  function getPeriodKey(period, date) {
    const y = date.getFullYear();
    const m = date.getMonth() + 1; // 1-12
    const d = date.getDate();
    switch (period) {
      case 'daily':
        return `${y}-${pad2(m)}-${pad2(d)}`;
      case 'weekly': {
        const { year, week } = getISOWeek(date);
        return `${year}-W${pad2(week)}`;
      }
      case 'monthly':
        return `${y}-${pad2(m)}`;
      case 'quarterly':
        return `${y}-Q${getQuarter(date)}`;
      case 'yearly':
        return String(y);
      default:
        return `${y}-${pad2(m)}-${pad2(d)}`;
    }
  }

  function getFriendlyPeriodLabel(period, date) {
    const y = date.getFullYear();
    const m = date.getMonth() + 1;
    const d = date.getDate();
    switch (period) {
      case 'daily':
        return `${y}-${pad2(m)}-${pad2(d)}`;
      case 'weekly': {
        const { year, week } = getISOWeek(date);
        return `Week ${week}, ${year}`;
      }
      case 'monthly':
        return `${date.toLocaleString(undefined, { month: 'long' })} ${y}`;
      case 'quarterly':
        return `Q${getQuarter(date)} ${y}`;
      case 'yearly':
        return `${y}`;
      default:
        return '';
    }
  }

  /**
   * Rendering
   */
  function renderDashboard(habits, completions, now) {
    const container = document.getElementById('dashboard');
    container.innerHTML = '';

    const periods = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'];

    periods.forEach((period) => {
      const periodKey = getPeriodKey(period, now);
      const periodHabits = habits.filter((h) => h.frequency === period);
      const total = periodHabits.length;
      let done = 0;
      if (total > 0) {
        for (const habit of periodHabits) {
          if (
            completions?.[period]?.[periodKey] &&
            Boolean(completions[period][periodKey][habit.id])
          ) {
            done += 1;
          }
        }
      }
      const percent = total === 0 ? 0 : Math.round((done / total) * 100);

      const card = document.createElement('div');
      card.className = 'stat-card';
      card.innerHTML = `
        <div class="stat-title">${periodLabels[period]}</div>
        <div class="stat-value">${percent}% <span class="muted">(${done}/${total})</span></div>
        <div class="progress"><span style="width:${percent}%"></span></div>
      `;
      container.appendChild(card);
    });
  }

  function renderHabitList(habits, completions, period, now) {
    const list = document.getElementById('habitList');
    const empty = document.getElementById('emptyState');
    const title = document.getElementById('listTitle');
    const subtitle = document.getElementById('listSubtitle');

    title.textContent = periodTitles[period] || 'Habits';
    subtitle.textContent = getFriendlyPeriodLabel(period, now);

    const periodHabits = habits
      .filter((h) => h.frequency === period)
      .slice()
      .sort((a, b) => parseTimeToMinutes(a.time) - parseTimeToMinutes(b.time));

    list.innerHTML = '';

    if (periodHabits.length === 0) {
      empty.hidden = false;
      return;
    }

    empty.hidden = true;

    const periodKey = getPeriodKey(period, now);

    for (const habit of periodHabits) {
      const li = document.createElement('li');
      li.className = 'habit-item';

      const checkboxWrap = document.createElement('div');
      checkboxWrap.className = 'checkbox';
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = Boolean(
        completions?.[period]?.[periodKey]?.[habit.id]
      );
      checkbox.addEventListener('change', () => {
        toggleCompletion(habit.id, period, periodKey, checkbox.checked);
        // Update dashboard instantly
        renderDashboard(state.habits, state.completions, state.now);
      });
      checkboxWrap.appendChild(checkbox);

      const time = document.createElement('div');
      time.className = 'habit-time';
      time.textContent = habit.time ? formatTimeDisplay(habit.time) : '';

      const text = document.createElement('div');
      text.className = 'habit-text';
      const triggerPart = habit.trigger?.trim() ? `After ${habit.trigger}` : '';
      const timePart = habit.time ? ` at ${formatTimeDisplay(habit.time)}` : '';
      text.textContent = `${triggerPart}${timePart}, I will ${habit.action}`;

      const meta = document.createElement('div');
      meta.className = 'badge';
      const dot = document.createElement('span');
      dot.className = 'dot';
      meta.appendChild(dot);
      const goal = document.createElement('span');
      goal.textContent = habit.goal || '—';
      meta.appendChild(goal);

      const delBtn = document.createElement('button');
      delBtn.className = 'ghost';
      delBtn.textContent = 'Delete';
      delBtn.addEventListener('click', () => {
        if (!confirm('Delete this habit?')) return;
        deleteHabit(habit.id);
      });

      li.appendChild(checkboxWrap);
      li.appendChild(time);
      li.appendChild(text);
      li.appendChild(meta);
      li.appendChild(delBtn);

      list.appendChild(li);
    }
  }

  /**
   * Mutations
   */
  function toggleCompletion(habitId, period, periodKey, isCompleted) {
    const completions = state.completions;
    if (!completions[period]) completions[period] = {};
    if (!completions[period][periodKey]) completions[period][periodKey] = {};
    completions[period][periodKey][habitId] = Boolean(isCompleted);
    saveCompletions(completions);
  }

  function addHabitFromForm(event) {
    event.preventDefault();
    const trigger = document.getElementById('triggerInput').value.trim();
    const time = document.getElementById('timeInput').value;
    const action = document.getElementById('actionInput').value.trim();
    const goal = document.getElementById('goalInput').value.trim();
    const frequency = document.getElementById('frequencySelect').value;

    if (!trigger || !action || !goal || !frequency) {
      alert('Please fill all fields.');
      return;
    }

    const newHabit = {
      id: generateHabitId(),
      trigger,
      time,
      action,
      goal,
      frequency,
      createdAt: Date.now(),
    };

    state.habits.push(newHabit);
    saveHabits(state.habits);

    // Clear form minimal
    document.getElementById('habitForm').reset();
    document.getElementById('timeInput').value = '06:00';

    // Re-render views
    renderAll();
  }

  function deleteHabit(habitId) {
    const idx = state.habits.findIndex((h) => h.id === habitId);
    if (idx >= 0) {
      state.habits.splice(idx, 1);
      saveHabits(state.habits);
      // Also clean up completions for this habit across all periods
      const comps = state.completions;
      for (const period of Object.keys(comps)) {
        const byKey = comps[period];
        for (const key of Object.keys(byKey)) {
          if (byKey[key] && byKey[key][habitId] !== undefined) {
            delete byKey[key][habitId];
          }
        }
      }
      saveCompletions(comps);
      renderAll();
    }
  }

  function clearCompletionsForCurrentPeriod() {
    const period = state.currentPeriod;
    const key = getPeriodKey(period, state.now);
    if (!confirm(`Reset all ${period} checkboxes for ${getFriendlyPeriodLabel(period, state.now)}?`)) return;
    if (!state.completions[period]) state.completions[period] = {};
    state.completions[period][key] = {};
    saveCompletions(state.completions);
    renderAll();
  }

  function clearAllData() {
    if (!confirm('This will delete all habits and history. Continue?')) return;
    localStorage.removeItem(HABITS_KEY);
    localStorage.removeItem(COMPLETIONS_KEY);
    state.habits = [];
    state.completions = {};
    ensureSeedData();
    renderAll();
  }

  /**
   * Seed sample habits on first run
   */
  function ensureSeedData() {
    const existing = loadHabits();
    if (existing && existing.length > 0) {
      state.habits = existing;
      return;
    }
    const samples = [
      {
        trigger: 'Wake up',
        time: '05:45',
        action: 'thank God',
        goal: 'gratitude',
        frequency: 'daily',
      },
      {
        trigger: 'Brush',
        time: '06:00',
        action: 'wash my face',
        goal: 'self-care',
        frequency: 'daily',
      },
      {
        trigger: 'Toilet',
        time: '06:15',
        action: 'do 10 pushups',
        goal: 'fitness',
        frequency: 'daily',
      },
      {
        trigger: 'Tea',
        time: '06:30',
        action: 'read a book for 20 minutes',
        goal: 'reading',
        frequency: 'daily',
      },
    ];
    const withIds = samples.map((s) => ({ id: generateHabitId(), createdAt: Date.now(), ...s }));
    saveHabits(withIds);
    state.habits = withIds;
  }

  /**
   * App state and initialization
   */
  const state = {
    habits: [],
    completions: {},
    currentPeriod: 'daily',
    now: getToday(),
  };

  function renderAll() {
    state.completions = loadCompletions();
    renderDashboard(state.habits, state.completions, state.now);
    renderHabitList(state.habits, state.completions, state.currentPeriod, state.now);
    const periodLabel = document.getElementById('currentPeriodLabel');
    periodLabel.textContent = getFriendlyPeriodLabel(state.currentPeriod, state.now);
  }

  function setupEventListeners() {
    document.getElementById('habitForm').addEventListener('submit', addHabitFromForm);
    document.getElementById('clearCompletionsBtn').addEventListener('click', clearCompletionsForCurrentPeriod);
    document.getElementById('clearAllBtn').addEventListener('click', clearAllData);

    const periodSelect = document.getElementById('periodSelect');
    periodSelect.addEventListener('change', () => {
      state.currentPeriod = periodSelect.value;
      renderAll();
    });
  }

  function init() {
    ensureSeedData();
    state.completions = loadCompletions();
    setupEventListeners();
    renderAll();
  }

  document.addEventListener('DOMContentLoaded', init);
})();