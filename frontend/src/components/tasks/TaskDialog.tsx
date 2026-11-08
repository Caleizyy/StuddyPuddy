import type { Task } from '@/api/tasks';
import { TaskForm } from '@/components/tasks/TaskForm';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type TaskDialogProps = {
  task?: Task; // given: edit. Missing: add.
  onClose: () => void;
  onSaved: (task: Task) => void;
};

export function TaskDialog({ task, onClose, onSaved }: TaskDialogProps) {
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{task ? 'Edit task' : 'Add a task'}</DialogTitle>
          <DialogDescription>
            {task
              ? 'Change anything you like. Your plan updates to match.'
              : 'The planner uses the deadline and the estimated hours to rank this task.'}
          </DialogDescription>
        </DialogHeader>
        <TaskForm task={task} onSaved={onSaved} onCancel={onClose} />
      </DialogContent>
    </Dialog>
  );
}
