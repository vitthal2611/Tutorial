import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

/**
 * Types
 */
 type Frequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

 interface Habit {
   id: string;
   trigger: string;
   time: string; // HH:mm
   action: string;
   goal: string;
   frequency: Frequency;
   createdAt: number;
 }

 interface CompletionsByPeriodKey {
   [habitId: string]: boolean;
 }

 interface CompletionsByKeyMap {
   [periodKey: string]: CompletionsByPeriodKey;
 }

 type CompletionsMap = Partial<Record<Frequency, CompletionsByKeyMap>>;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div id="app">
      <header class="topbar">
        <h1>Habit Tracker</h1>
        <div class="view-controls">
          <label for="periodSelect">View:</label>
          <select id="periodSelect" [(ngModel)]="currentPeriod" (change)="onPeriodChange()">
            <option *ngFor="let p of periodOptions" [value]="p">{{ periodLabels[p] }}</option>
          </select>
          <span class="muted">{{ getFriendlyPeriodLabel(currentPeriod, now) }}</span>
        </div>
      </header>

      <section class="dashboard" aria-label="Completion dashboard">
        <div class="stat-card" *ngFor="let stat of getDashboardStats()">
          <div class="stat-title">{{ stat.label }}</div>
          <div class="stat-value">{{ stat.percent }}% <span class="muted">({{ stat.done }}/{{ stat.total }})</span></div>
          <div class="progress"><span [style.width.%]="stat.percent"></span></div>
        </div>
      </section>

      <section class="add-habit" aria-label="Add new habit">
        <h2>Add Habit</h2>
        <form (ngSubmit)="addHabit()" #habitForm="ngForm">
          <div class="form-row">
            <label for="triggerInput">Trigger</label>
            <input id="triggerInput" type="text" required [(ngModel)]="form.trigger" name="trigger" placeholder="After Brush">
          </div>
          <div class="form-row">
            <label for="timeInput">Time</label>
            <input id="timeInput" type="time" required [(ngModel)]="form.time" name="time">
          </div>
          <div class="form-row">
            <label for="actionInput">Action</label>
            <input id="actionInput" type="text" required [(ngModel)]="form.action" name="action" placeholder="I will wash my face">
          </div>
          <div class="form-row">
            <label for="goalInput">Goal</label>
            <input id="goalInput" type="text" required [(ngModel)]="form.goal" name="goal" placeholder="fitness">
          </div>
          <div class="form-row">
            <label for="frequencySelect">Frequency</label>
            <select id="frequencySelect" required [(ngModel)]="form.frequency" name="frequency">
              <option *ngFor="let p of periodOptions" [value]="p">{{ periodLabels[p] }}</option>
            </select>
          </div>
          <div class="form-actions">
            <button type="submit" class="primary">Add Habit</button>
            <button type="button" id="clearCompletionsBtn" class="ghost" (click)="clearCompletionsForCurrentPeriod()">Reset current period</button>
            <button type="button" id="clearAllBtn" class="danger ghost" (click)="clearAllData()">Clear all</button>
          </div>
        </form>
      </section>

      <section class="habits" aria-label="Habits list">
        <div class="list-header">
          <h2>{{ periodTitles[currentPeriod] }}</h2>
          <div class="list-subtitle">{{ getFriendlyPeriodLabel(currentPeriod, now) }}</div>
        </div>
        <ul class="habit-list">
          <li class="habit-item" *ngFor="let habit of getHabitsForCurrentPeriod(); trackBy: trackHabitById">
            <div class="checkbox">
              <input type="checkbox" [checked]="isHabitCompleted(habit)" (change)="onToggleCompletion(habit, $any($event.target).checked)">
            </div>
            <div class="habit-time">{{ habit.time ? formatTimeDisplay(habit.time) : '' }}</div>
            <div class="habit-text">{{ getHabitDisplayText(habit) }}</div>
            <div class="badge"><span class="dot"></span><span>{{ habit.goal || '—' }}</span></div>
            <button class="ghost" (click)="deleteHabit(habit)">Delete</button>
          </li>
        </ul>
        <div class="empty-state" *ngIf="getHabitsForCurrentPeriod().length === 0">
          No habits yet for this period. Add one above.
        </div>
      </section>

      <footer class="footer">
        <span class="muted">Data is stored locally in your browser.</span>
      </footer>
    </div>
  `,
  styles: [],
})
export class App implements OnInit {
  private readonly HABITS_KEY = 'habitTracker.habits';
  private readonly COMPLETIONS_KEY = 'habitTracker.completions';

  readonly periodOptions: Frequency[] = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'];

  readonly periodTitles: Record<Frequency, string> = {
    daily: "Today's Habits",
    weekly: "This Week's Habits",
    monthly: "This Month's Habits",
    quarterly: "This Quarter's Habits",
    yearly: "This Year's Habits",
  };

  readonly periodLabels: Record<Frequency, string> = {
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    yearly: 'Yearly',
  };

  habits: Habit[] = [];
  completions: CompletionsMap = {};
  currentPeriod: Frequency = 'daily';
  now: Date = new Date();

  form: { trigger: string; time: string; action: string; goal: string; frequency: Frequency } = {
    trigger: '',
    time: '06:00',
    action: '',
    goal: '',
    frequency: 'daily',
  };

  ngOnInit(): void {
    this.ensureSeedData();
    this.completions = this.loadCompletions();
  }

  // Persistence
  private loadHabits(): Habit[] {
    const raw = localStorage.getItem(this.HABITS_KEY);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private saveHabits(): void {
    localStorage.setItem(this.HABITS_KEY, JSON.stringify(this.habits));
  }

  private loadCompletions(): CompletionsMap {
    const raw = localStorage.getItem(this.COMPLETIONS_KEY);
    if (!raw) return {} as CompletionsMap;
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : ({} as CompletionsMap);
    } catch {
      return {} as CompletionsMap;
    }
  }

  private saveCompletions(): void {
    localStorage.setItem(this.COMPLETIONS_KEY, JSON.stringify(this.completions));
  }

  private generateHabitId(): string {
    return 'h_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
  }

  // Period helpers
  private pad2(n: number): string { return String(n).padStart(2, '0'); }

  private getISOWeek(date: Date): { year: number; week: number } {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNumber = Math.ceil((((Number(d) - Number(yearStart)) / 86400000) + 1) / 7);
    return { year: d.getUTCFullYear(), week: weekNumber };
  }

  private getQuarter(date: Date): number { return Math.floor(date.getMonth() / 3) + 1; }

  getPeriodKey(period: Frequency, date: Date): string {
    const y = date.getFullYear();
    const m = date.getMonth() + 1;
    const d = date.getDate();
    switch (period) {
      case 'daily': return `${y}-${this.pad2(m)}-${this.pad2(d)}`;
      case 'weekly': {
        const { year, week } = this.getISOWeek(date);
        return `${year}-W${this.pad2(week)}`;
      }
      case 'monthly': return `${y}-${this.pad2(m)}`;
      case 'quarterly': return `${y}-Q${this.getQuarter(date)}`;
      case 'yearly': return String(y);
    }
  }

  getFriendlyPeriodLabel(period: Frequency, date: Date): string {
    const y = date.getFullYear();
    const m = date.getMonth() + 1;
    const d = date.getDate();
    switch (period) {
      case 'daily': return `${y}-${this.pad2(m)}-${this.pad2(d)}`;
      case 'weekly': {
        const { year, week } = this.getISOWeek(date);
        return `Week ${week}, ${year}`;
      }
      case 'monthly': return `${date.toLocaleString(undefined, { month: 'long' })} ${y}`;
      case 'quarterly': return `Q${this.getQuarter(date)} ${y}`;
      case 'yearly': return `${y}`;
    }
  }

  // Rendering helpers
  parseTimeToMinutes(time: string): number {
    if (!time) return 0;
    const [hh, mm] = time.split(':').map(Number);
    if (Number.isNaN(hh) || Number.isNaN(mm)) return 0;
    return hh * 60 + mm;
  }

  formatTimeDisplay(time: string): string {
    if (!time) return '';
    const [hh, mm] = time.split(':').map(Number);
    const ampm = hh >= 12 ? 'PM' : 'AM';
    const hour12 = hh % 12 === 0 ? 12 : hh % 12;
    const mmStr = String(mm).padStart(2, '0');
    return `${hour12}:${mmStr} ${ampm}`;
  }

  getHabitDisplayText(habit: Habit): string {
    const triggerPart = habit.trigger?.trim() ? `After ${habit.trigger}` : '';
    const timePart = habit.time ? ` at ${this.formatTimeDisplay(habit.time)}` : '';
    return `${triggerPart}${timePart}, I will ${habit.action}`;
  }

  // Dashboard
  getDashboardStats(): Array<{ period: Frequency; label: string; total: number; done: number; percent: number }> {
    const now = this.now;
    return this.periodOptions.map((period) => {
      const periodKey = this.getPeriodKey(period, now);
      const periodHabits = this.habits.filter((h) => h.frequency === period);
      const total = periodHabits.length;
      let done = 0;
      if (total > 0) {
        for (const habit of periodHabits) {
          if (this.completions?.[period]?.[periodKey]?.[habit.id]) done += 1;
        }
      }
      const percent = total === 0 ? 0 : Math.round((done / total) * 100);
      return { period, label: this.periodLabels[period], total, done, percent };
    });
  }

  // List and actions
  getHabitsForCurrentPeriod(): Habit[] {
    return this.habits
      .filter((h) => h.frequency === this.currentPeriod)
      .slice()
      .sort((a, b) => this.parseTimeToMinutes(a.time) - this.parseTimeToMinutes(b.time));
  }

  isHabitCompleted(habit: Habit): boolean {
    const key = this.getPeriodKey(this.currentPeriod, this.now);
    return Boolean(this.completions?.[this.currentPeriod]?.[key]?.[habit.id]);
  }

  onToggleCompletion(habit: Habit, checked: boolean): void {
    const period = this.currentPeriod;
    const key = this.getPeriodKey(period, this.now);
    if (!this.completions[period]) this.completions[period] = {};
    if (!this.completions[period]![key]) this.completions[period]![key] = {};
    this.completions[period]![key]![habit.id] = Boolean(checked);
    this.saveCompletions();
  }

  addHabit(): void {
    const { trigger, time, action, goal, frequency } = this.form;
    if (!trigger || !time || !action || !goal || !frequency) return;
    const newHabit: Habit = {
      id: this.generateHabitId(),
      trigger: trigger.trim(),
      time,
      action: action.trim(),
      goal: goal.trim(),
      frequency,
      createdAt: Date.now(),
    };
    this.habits.push(newHabit);
    this.saveHabits();

    this.form = { trigger: '', time: '06:00', action: '', goal: '', frequency: this.currentPeriod };
  }

  deleteHabit(habit: Habit): void {
    if (!confirm('Delete this habit?')) return;
    this.habits = this.habits.filter((h) => h.id !== habit.id);
    this.saveHabits();

    // Clean completions for this habit across all periods and keys
    for (const period of Object.keys(this.completions) as Frequency[]) {
      const byKey = this.completions[period];
      if (!byKey) continue;
      for (const k of Object.keys(byKey)) {
        if (byKey[k] && byKey[k]![habit.id] !== undefined) {
          delete byKey[k]![habit.id];
        }
      }
    }
    this.saveCompletions();
  }

  clearCompletionsForCurrentPeriod(): void {
    const period = this.currentPeriod;
    const key = this.getPeriodKey(period, this.now);
    if (!confirm(`Reset all ${period} checkboxes for ${this.getFriendlyPeriodLabel(period, this.now)}?`)) return;
    if (!this.completions[period]) this.completions[period] = {};
    this.completions[period]![key] = {};
    this.saveCompletions();
  }

  clearAllData(): void {
    if (!confirm('This will delete all habits and history. Continue?')) return;
    localStorage.removeItem(this.HABITS_KEY);
    localStorage.removeItem(this.COMPLETIONS_KEY);
    this.habits = [];
    this.completions = {};
    this.ensureSeedData();
  }

  onPeriodChange(): void {
    // No-op; bindings update views automatically
  }

  trackHabitById(index: number, habit: Habit): string { return habit.id; }

  // Seed
  private ensureSeedData(): void {
    const existing = this.loadHabits();
    if (existing && existing.length > 0) {
      this.habits = existing;
      return;
    }
    const samples: Array<Omit<Habit, 'id' | 'createdAt'>> = [
      { trigger: 'Wake up', time: '05:45', action: 'thank God', goal: 'gratitude', frequency: 'daily' },
      { trigger: 'Brush', time: '06:00', action: 'wash my face', goal: 'self-care', frequency: 'daily' },
      { trigger: 'Toilet', time: '06:15', action: 'do 10 pushups', goal: 'fitness', frequency: 'daily' },
      { trigger: 'Tea', time: '06:30', action: 'read a book for 20 minutes', goal: 'reading', frequency: 'daily' },
    ];
    this.habits = samples.map((s) => ({ id: this.generateHabitId(), createdAt: Date.now(), ...s }));
    this.saveHabits();
  }
}
