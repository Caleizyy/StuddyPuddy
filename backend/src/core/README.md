# Planning core

Pure planning logic: it scores tasks and builds a study plan. It has no imports from Express, the database or any other layer, and it never reads the clock. The current time is always passed in.

## Input

`buildPlan({ tasks, hoursByWeekday, now, settings })`

- `tasks`: a list of `{ id, title, deadline: Date, estimatedHours, loggedHours?, createdAt: Date, status }`. Status is `todo`, `in_progress` or `done`.
- `hoursByWeekday`: 7 numbers of study hours, **Sunday first** (index 0 = Sunday ... 6 = Saturday).
- `now`: a `Date`. Days are counted as UTC calendar days.
- `settings` (optional): the client's own settings. Today it has one field, `maxHoursPerDay`: a personal daily study limit from 0.25 to 24 hours, or `null` for no limit. Without settings the plan is built exactly as before.

`loggedHours` (optional, default 0) is the time already studied for the task. The plan only schedules and scores what is left: `remainingHours = max(0, estimatedHours - loggedHours)`.

Allowed values: `estimatedHours` from above 0 up to 200, and every hours value (task or weekday) in steps of 0.25. A weekday has 0 to 24 hours. A deadline must be a valid date. At most 100 unfinished tasks.

## Output

A plan with four parts:

- `items`: every unfinished task, most urgent first, each with `priorityScore`, `band` (high, medium or low), `atRisk`, `overdue`, `remainingDays`, `availableHours`, `scheduledHours`, `unscheduledHours`, `loggedHours` and `remainingHours`.
- `schedule`: study hours per day, as `{ date, taskId, title, hours }`, ordered by date.
- `warnings`: one entry for each task whose hours do not all fit before its deadline.
- `feasible`: `true` when there are no warnings.

## Rules

- Score = (hours still needed / study hours available before the deadline) x (1 / days remaining). Hours still needed are the estimate minus the logged hours.
- A task with nothing left (logged hours cover the estimate) has score 0, is never at risk and never overdue, and gets no study hours. It stays in the plan until it is marked done.
- Bands: high from 0.10, medium from 0.04, low below that.
- A task due today counts as 1 remaining day. An overdue task, or a task with no study time at all, gets the maximum score.
- Ties are broken by earlier deadline, then longer task, then earlier creation time.
- Finished tasks (`done`) are left out of the plan.
- Hours are handed out to the most urgent task first, on the earliest free days. A day never gets more hours than the user has for that weekday. With a daily limit, each weekday counts as the smaller of its hours and the limit, for the priority scores, the at-risk flags and the schedule alike.

## Errors

Invalid input throws `PlanningInputError`. Its `field` property names what to fix: `deadline`, `estimatedHours`, `loggedHours`, `availability`, `maxHoursPerDay` or `tasks` (more than 100 unfinished tasks).
