# Planning core

Pure planning logic: it scores tasks and builds a study plan. It has no imports from Express, the database or any other layer, and it never reads the clock. The current time is always passed in.

## Input

`buildPlan({ tasks, hoursByWeekday, now })`

- `tasks`: a list of `{ id, title, deadline: Date, estimatedHours, createdAt: Date, status }`. Status is `todo`, `in_progress` or `done`.
- `hoursByWeekday`: 7 numbers of study hours, **Sunday first** (index 0 = Sunday ... 6 = Saturday).
- `now`: a `Date`. Days are counted as UTC calendar days.

Allowed values: `estimatedHours` from above 0 up to 200, and every hours value (task or weekday) in steps of 0.25. A weekday has 0 to 24 hours. A deadline must be a valid date. At most 100 unfinished tasks.

## Output

A plan with four parts:

- `items`: every unfinished task, most urgent first, each with `priorityScore`, `band` (high, medium or low), `atRisk`, `overdue`, `remainingDays`, `availableHours`, `scheduledHours` and `unscheduledHours`.
- `schedule`: study hours per day, as `{ date, taskId, title, hours }`, ordered by date.
- `warnings`: one entry for each task whose hours do not all fit before its deadline.
- `feasible`: `true` when there are no warnings.

## Rules

- Score = (hours needed / study hours available before the deadline) x (1 / days remaining).
- Bands: high from 0.10, medium from 0.04, low below that.
- A task due today counts as 1 remaining day. An overdue task, or a task with no study time at all, gets the maximum score.
- Ties are broken by earlier deadline, then longer task, then earlier creation time.
- Finished tasks (`done`) are left out of the plan.
- Hours are handed out to the most urgent task first, on the earliest free days. A day never gets more hours than the user has for that weekday.

## Errors

Invalid input throws `PlanningInputError`. Its `field` property names what to fix: `deadline`, `estimatedHours`, `availability` or `tasks` (more than 100 unfinished tasks).
