package com.example.habit.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class Habit {
	@NotBlank
	private String id;
	@NotBlank
	private String trigger;
	@Pattern(regexp = "^\\d{2}:\\d{2}$")
	private String time; // HH:mm
	@NotBlank
	private String action;
	@NotBlank
	private String goal;
	@NotBlank
	private String frequency; // daily, weekly, monthly, quarterly, yearly
	private long createdAt;

	public String getId() { return id; }
	public void setId(String id) { this.id = id; }
	public String getTrigger() { return trigger; }
	public void setTrigger(String trigger) { this.trigger = trigger; }
	public String getTime() { return time; }
	public void setTime(String time) { this.time = time; }
	public String getAction() { return action; }
	public void setAction(String action) { this.action = action; }
	public String getGoal() { return goal; }
	public void setGoal(String goal) { this.goal = goal; }
	public String getFrequency() { return frequency; }
	public void setFrequency(String frequency) { this.frequency = frequency; }
	public long getCreatedAt() { return createdAt; }
	public void setCreatedAt(long createdAt) { this.createdAt = createdAt; }
}