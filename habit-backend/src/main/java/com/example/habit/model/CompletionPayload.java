package com.example.habit.model;

import jakarta.validation.constraints.NotBlank;

public class CompletionPayload {
	@NotBlank
	private String habitId;
	private boolean completed;

	public String getHabitId() { return habitId; }
	public void setHabitId(String habitId) { this.habitId = habitId; }
	public boolean isCompleted() { return completed; }
	public void setCompleted(boolean completed) { this.completed = completed; }
}