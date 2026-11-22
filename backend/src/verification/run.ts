// Runs every correctness check and returns the results as rows of a table.
//   npm run verify:correctness            prints the table
//   npm run verify:correctness -- --write also saves it to docs/verification-correctness.md
//
// The same function is used by the test (correctness.test.ts), so `npm test` and this
// command can never disagree.

import { buildPlan } from '../core/plan.js';
import type { Plan } from '../core/types.js';
import { CHECKS, type PlanCase } from './invariants.js';
import { randomCase } from './random.js';
import { buildScenarios, type Scenario } from './scenarios.js';

export const RANDOM_CASES = 1000;
export const FIRST_SEED = 1;

export type ResultRow = {
  id: string;
  criterion: string;
  expected: string;
  actual: string;
  passed: boolean;
};

export function runPlan(input: PlanCase): Plan {
  return buildPlan(input);
}

// Turns a plan into the same simple shape the scenarios use, so the two can be compared
function summarise(plan: Plan) {
  const unscheduled: Record<string, number> = {};
  for (const item of plan.items) {
    if (item.unscheduledHours > 0) unscheduled[item.title] = item.unscheduledHours;
  }
  return {
    order: plan.items.map((item) => item.title),
    schedule: plan.schedule.map((entry) => [entry.date, entry.title, entry.hours]),
    unscheduled,
    feasible: plan.feasible,
  };
}

export function scenarioMismatch(scenario: Scenario): string | null {
  const actual = summarise(runPlan(scenario.input));
  const expected = {
    order: scenario.expected.order,
    schedule: scenario.expected.schedule,
    unscheduled: scenario.expected.unscheduled,
    feasible: scenario.expected.feasible,
  };
  return JSON.stringify(actual) === JSON.stringify(expected)
    ? null
    : `expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`;
}

// Problems found in one case, as readable lines. Includes the two checks that need the
// planner to be run twice (same answer both times, and the input left untouched).
export function problemsInCase(input: PlanCase): string[] {
  const before = JSON.stringify(input);
  const plan = runPlan(input);
  const problems = CHECKS.flatMap((check) =>
    check.run(input, plan).map((p) => `${check.id}: ${p}`),
  );
  if (JSON.stringify(input) !== before) problems.push('R8: the planner changed its input');
  if (JSON.stringify(runPlan(input)) !== JSON.stringify(plan)) {
    problems.push('R8: the same input gave a different plan the second time');
  }
  return problems;
}

export function runCorrectnessChecks(): ResultRow[] {
  const rows: ResultRow[] = [];

  // C1: the predefined scenarios
  const scenarios = buildScenarios();
  const mismatches = scenarios
    .map((scenario) => ({ scenario, mismatch: scenarioMismatch(scenario) }))
    .filter((entry) => entry.mismatch !== null);
  rows.push({
    id: 'C1',
    criterion: 'All predefined scenario tests match the rules',
    expected: `${scenarios.length} of ${scenarios.length} scenarios equal the hand-worked result`,
    actual:
      `${scenarios.length - mismatches.length} of ${scenarios.length} match` +
      mismatches.map((m) => ` (${m.scenario.id} differs)`).join(''),
    passed: mismatches.length === 0,
  });

  // Every scenario must also satisfy the general rules
  const scenarioProblems = scenarios.flatMap((s) =>
    problemsInCase(s.input).map((p) => `${s.id} ${p}`),
  );

  // C2 to C9: the general rules, over the scenarios and many random inputs
  const randomProblems: string[] = [];
  for (let seed = FIRST_SEED; seed < FIRST_SEED + RANDOM_CASES; seed++) {
    for (const problem of problemsInCase(randomCase(seed)))
      randomProblems.push(`seed ${seed} ${problem}`);
  }
  const all = [...scenarioProblems, ...randomProblems];
  const total = scenarios.length + RANDOM_CASES;

  const rules = [
    ...CHECKS.map((check) => ({ id: check.id, name: check.name })),
    { id: 'R8', name: 'The same input always gives the same plan, and the input is not changed' },
  ];
  rules.forEach((rule, index) => {
    const violations = all.filter((problem) => problem.includes(`${rule.id}:`));
    rows.push({
      id: `C${index + 2}`,
      criterion: `${rule.id}: ${rule.name}`,
      expected: `0 violations in ${total} cases`,
      actual:
        `${violations.length} violations in ${total} cases` +
        (violations.length > 0 ? ` (first: ${violations[0]})` : ''),
      passed: violations.length === 0,
    });
  });

  return rows;
}

export function toMarkdown(rows: ResultRow[]): string {
  const line = (cells: string[]) => `| ${cells.join(' | ')} |`;
  return [
    line(['#', 'Criterion', 'Expected', 'Actual', 'Result']),
    line(['---', '---', '---', '---', '---']),
    ...rows.map((row) =>
      line([row.id, row.criterion, row.expected, row.actual, row.passed ? 'PASS' : 'FAIL']),
    ),
  ].join('\n');
}
