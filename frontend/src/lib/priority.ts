// The planner gives a huge score to overdue tasks and tasks with no study time, so we show "max"
export function formatScore(score: number): string {
  return score >= 1000 ? 'max' : score.toFixed(2);
}
