import { Edit2, Trash2, Calendar, AlertCircle } from 'lucide-react';
import type { Task } from '../types/task';
import { PRIORITY_COLORS } from '../utils/constants';
import './TaskCard.css';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

function TaskCard({ task, onEdit, onDelete }: TaskCardProps) {
  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };

  return (
    <div className="task-card">
      {/* Priority Badge */}
      <div 
        className={`priority-badge priority-${task.priority}`}
        style={{ backgroundColor: PRIORITY_COLORS[task.priority] }}
      >
        {task.priority}
      </div>

      {/* Task Title */}
      <h3 className="task-title">{task.title}</h3>

      {/* Task Description (nếu có) */}
      {task.description && (
        <p className="task-description">{task.description}</p>
      )}

      {/* Due Date (nếu có) */}
      {task.dueDate && (
        <div className="task-meta">
          <Calendar size={14} />
          <span>{formatDate(task.dueDate)}</span>
        </div>
      )}

      {/* Actions: Edit và Delete */}
      <div className="task-actions">
        <button
          className="btn-icon btn-edit"
          onClick={() => onEdit(task)}
          title="Edit task"
        >
          <Edit2 size={16} />
        </button>
        <button
          className="btn-icon btn-delete"
          onClick={() => onDelete(task._id)}
          title="Delete task"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

export default TaskCard;