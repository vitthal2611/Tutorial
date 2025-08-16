# Habit Tracker (Single Page App)

A minimal local-only habit tracker that lets you create habits with a time-based trigger, associate them with a goal, and track completion by period (daily, weekly, monthly, quarterly, yearly). All data is stored in your browser via localStorage.

## Features
- Add habits with: Trigger, Time, Action, Goal, Frequency
- View habits per period, sorted by time
- Check off completions for the current day/week/month/quarter/year
- Dashboard showing % completion per period
- Delete habits; reset current period; clear all data
- Comes pre-seeded with four example habits

## Run locally
Open `index.html` in a browser, or serve the folder:

```bash
# From repo root
python3 -m http.server 8080
# Then open http://localhost:8080 in your browser
```

No build step required.