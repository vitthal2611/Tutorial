package com.example.habit.web;

import com.example.habit.model.CompletionPayload;
import com.example.habit.model.Habit;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = {"http://localhost:4200", "http://127.0.0.1:4200"})
public class HabitController {

	private final Map<String, Habit> idToHabit = new ConcurrentHashMap<>();
	// completions[period][periodKey][habitId] = boolean
	private final Map<String, Map<String, Map<String, Boolean>>> completions = new ConcurrentHashMap<>();

	@GetMapping("/habits")
	public List<Habit> getHabits() {
		return idToHabit.values().stream()
				.sorted(Comparator.comparing(Habit::getTime, Comparator.nullsFirst(Comparator.naturalOrder())))
				.collect(Collectors.toList());
	}

	@PostMapping("/habits")
	public ResponseEntity<Habit> addHabit(@Valid @RequestBody Habit habit) {
		if (habit.getId() == null || habit.getId().isBlank()) {
			habit.setId(generateId());
		}
		if (habit.getCreatedAt() == 0) {
			habit.setCreatedAt(System.currentTimeMillis());
		}
		idToHabit.put(habit.getId(), habit);
		return ResponseEntity.status(HttpStatus.CREATED).body(habit);
	}

	@DeleteMapping("/habits/{id}")
	public ResponseEntity<Void> deleteHabit(@PathVariable String id) {
		idToHabit.remove(id);
		completions.values().forEach(byKey -> byKey.values().forEach(map -> map.remove(id)));
		return ResponseEntity.noContent().build();
	}

	@GetMapping("/completions/{period}/{periodKey}")
	public Map<String, Boolean> getCompletions(@PathVariable String period, @PathVariable String periodKey) {
		return completions.getOrDefault(period, Collections.emptyMap()).getOrDefault(periodKey, Collections.emptyMap());
	}

	@PostMapping("/completions/{period}/{periodKey}")
	public Map<String, Boolean> setCompletion(
			@PathVariable String period,
			@PathVariable String periodKey,
			@Valid @RequestBody CompletionPayload payload
	) {
		completions.computeIfAbsent(period, p -> new ConcurrentHashMap<>())
				.computeIfAbsent(periodKey, k -> new ConcurrentHashMap<>())
				.put(payload.getHabitId(), payload.isCompleted());
		return completions.get(period).get(periodKey);
	}

	@PostMapping("/seed")
	public List<Habit> seedDefaults() {
		idToHabit.clear();
		List<Habit> samples = new ArrayList<>();
		samples.add(create("Wake up", "05:45", "thank God", "gratitude", "daily"));
		samples.add(create("Brush", "06:00", "wash my face", "self-care", "daily"));
		samples.add(create("Toilet", "06:15", "do 10 pushups", "fitness", "daily"));
		samples.add(create("Tea", "06:30", "read a book for 20 minutes", "reading", "daily"));
		samples.forEach(h -> idToHabit.put(h.getId(), h));
		return getHabits();
	}

	private Habit create(String trigger, String time, String action, String goal, String frequency) {
		Habit h = new Habit();
		h.setId(generateId());
		h.setTrigger(trigger);
		h.setTime(time);
		h.setAction(action);
		h.setGoal(goal);
		h.setFrequency(frequency);
		h.setCreatedAt(System.currentTimeMillis());
		return h;
	}

	private String generateId() {
		return "h_" + Long.toString(System.currentTimeMillis(), 36) + "_" + UUID.randomUUID().toString().substring(0, 5);
	}
}