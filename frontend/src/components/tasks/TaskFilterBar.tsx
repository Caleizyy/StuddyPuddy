import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import {
  DUE_LABELS,
  DUE_OPTIONS,
  hasActiveFilters,
  SORT_LABELS,
  SORT_OPTIONS,
  STATUS_FILTER_LABELS,
  STATUS_FILTERS,
  type TaskFilters,
} from '@/lib/taskFilters';
import { CATEGORY_LABELS, TASK_CATEGORIES } from '@/lib/taskOptions';

type Props = {
  filters: TaskFilters;
  onChange: (changes: Partial<TaskFilters>) => void;
  onClear: () => void;
};

export function TaskFilterBar({ filters, onChange, onClear }: Props) {
  // The text box keeps what is typed at once; the list follows a moment after typing stops
  const [text, setText] = useState(filters.q);
  useEffect(() => setText(filters.q), [filters.q]); // address changed (back button, clear)
  useEffect(() => {
    if (text === filters.q) return;
    const timer = setTimeout(() => onChange({ q: text }), 300);
    return () => clearTimeout(timer);
  }, [text, filters.q, onChange]);

  return (
    <div role="search" aria-label="Filter tasks" className="space-y-3">
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          type="search"
          aria-label="Search tasks by title"
          placeholder="Search by title"
          maxLength={80}
          className="pl-8"
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <NativeSelect
          aria-label="Status"
          value={filters.status}
          onChange={(event) => onChange({ status: event.target.value as TaskFilters['status'] })}
        >
          {STATUS_FILTERS.map((value) => (
            <option key={value} value={value}>
              {STATUS_FILTER_LABELS[value]}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect
          aria-label="Category"
          value={filters.category}
          onChange={(event) =>
            onChange({ category: event.target.value as TaskFilters['category'] })
          }
        >
          <option value="any">All categories</option>
          {TASK_CATEGORIES.map((value) => (
            <option key={value} value={value}>
              {CATEGORY_LABELS[value]}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect
          aria-label="Deadline"
          value={filters.due}
          onChange={(event) => onChange({ due: event.target.value as TaskFilters['due'] })}
        >
          {DUE_OPTIONS.map((value) => (
            <option key={value} value={value}>
              {DUE_LABELS[value]}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect
          aria-label="Sort by"
          value={filters.sort}
          onChange={(event) => onChange({ sort: event.target.value as TaskFilters['sort'] })}
        >
          {SORT_OPTIONS.map((value) => (
            <option key={value} value={value}>
              {SORT_LABELS[value]}
            </option>
          ))}
        </NativeSelect>
        {hasActiveFilters(filters) && (
          <Button variant="ghost" size="sm" onClick={onClear}>
            <X />
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}
