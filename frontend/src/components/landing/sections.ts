import {
  BarChart3,
  CalendarDays,
  Download,
  ListTree,
  ShieldCheck,
  SlidersHorizontal,
  Timer,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react';

export type Step = { title: string; text: string };
export type Feature = { icon: LucideIcon; title: string; text: string };

export const STEPS: Step[] = [
  {
    title: 'Add your deadlines',
    text: 'Homework, exams, quizzes and labs. Give each a date and a rough estimate of the hours it needs.',
  },
  {
    title: 'Say when you can study',
    text: 'Set the hours you really have on each day of the week, and an optional daily limit so you never burn out.',
  },
  {
    title: 'Follow your plan',
    text: 'StuddyPuddy ranks your tasks by urgency and spreads the work over the days before each deadline.',
  },
];

export const FEATURES: Feature[] = [
  {
    icon: BarChart3,
    title: 'Clear priorities',
    text: 'Every task gets a priority from the work it needs, the time you have and the days left.',
  },
  {
    icon: CalendarDays,
    title: 'A day-by-day plan',
    text: 'See exactly what to study today and tomorrow, not just a list of dates.',
  },
  {
    icon: TriangleAlert,
    title: 'Honest warnings',
    text: 'When there is not enough time before a deadline, the plan says so early instead of hiding it.',
  },
  {
    icon: ListTree,
    title: 'Big tasks, small steps',
    text: 'Split an exam or a project into topics and tick them off one at a time.',
  },
  {
    icon: Timer,
    title: 'Time logging',
    text: 'Log what you studied. The plan only schedules the hours you have left.',
  },
  {
    icon: SlidersHorizontal,
    title: 'Made to fit you',
    text: 'Light or dark theme, your week start, and the page you want to open first.',
  },
];

export const PRIVACY: Feature[] = [
  {
    icon: ShieldCheck,
    title: 'Your tasks are yours',
    text: 'Nobody else can see your tasks, and you can sign out of every device whenever you like.',
  },
  {
    icon: Download,
    title: 'Take it with you, or delete it',
    text: 'Download all your data as a file, or delete your account and everything in it.',
  },
];
