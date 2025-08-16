import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export type Frequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export interface Habit {
	id: string;
	trigger: string;
	time: string;
	action: string;
	goal: string;
	frequency: Frequency;
	createdAt: number;
}

@Injectable({ providedIn: 'root' })
export class HabitService {
	private readonly baseUrl = 'http://localhost:8081/api';
	constructor(private http: HttpClient) {}

	getHabits(): Promise<Habit[]> {
		return firstValueFrom(this.http.get<Habit[]>(`${this.baseUrl}/habits`));
	}

	addHabit(habit: Habit): Promise<Habit> {
		return firstValueFrom(this.http.post<Habit>(`${this.baseUrl}/habits`, habit));
	}

	deleteHabit(id: string): Promise<void> {
		return firstValueFrom(this.http.delete<void>(`${this.baseUrl}/habits/${id}`));
	}

	getCompletions(period: Frequency, periodKey: string): Promise<Record<string, boolean>> {
		return firstValueFrom(this.http.get<Record<string, boolean>>(`${this.baseUrl}/completions/${period}/${periodKey}`));
	}

	setCompletion(period: Frequency, periodKey: string, habitId: string, completed: boolean): Promise<Record<string, boolean>> {
		return firstValueFrom(this.http.post<Record<string, boolean>>(`${this.baseUrl}/completions/${period}/${periodKey}`, { habitId, completed }));
	}
}