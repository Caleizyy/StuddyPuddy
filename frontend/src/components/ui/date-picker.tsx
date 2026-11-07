import { useState } from 'react';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { fromDateText, toDateText } from '@/lib/dateText';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

type DatePickerProps = {
  id?: string;
  value: string; // 2026-12-01, or empty text when nothing is picked
  onChange: (value: string) => void;
  invalid?: boolean;
};

export function DatePicker({ id, value, onChange, invalid }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = fromDateText(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        id={id}
        aria-invalid={invalid}
        className={cn(
          buttonVariants({ variant: 'outline' }),
          'w-full justify-start font-normal',
          !selected && 'text-muted-foreground',
        )}
      >
        <CalendarIcon />
        {selected
          ? selected.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
          : 'Pick a date'}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          required
          selected={selected}
          defaultMonth={selected}
          onSelect={(date) => {
            onChange(toDateText(date));
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
