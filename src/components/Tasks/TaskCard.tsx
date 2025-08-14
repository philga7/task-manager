import React from 'react';
import { useState } from 'react';
import { Task } from '../../types';
import { TaskForm } from './TaskForm';
import { Calendar, Flag, CheckCircle2, Circle } from 'lucide-react';
import { format } from 'date-fns';
import { useApp } from '../../context/AppContext';

interface TaskCardProps {
  task: Task;
}

export function TaskCard({ task }: TaskCardProps) {
  const { dispatch } = useApp();
  const [showEditForm, setShowEditForm] = useState(false);

  const toggleComplete = () => {
    const updatedTask: Task = {
      ...task,
      status: task.status === 'completed' ? 'todo' : 'completed',
      completedAt: task.status === 'completed' ? undefined : new Date()
    };
    dispatch({ type: 'UPDATE_TASK', payload: updatedTask });
  };

  const priorityColors = {
    low: 'text-stone-500',
    medium: 'text-amber-500',
    high: 'text-red-500'
  };

  const isCompleted = task.status === 'completed';

  return (
    <>
      <div 
        className={`bg-stone-900 rounded-2xl border border-stone-800 p-3 md:p-4 hover:shadow-md hover:border-stone-700 transition-all duration-250 cursor-pointer ${isCompleted ? 'opacity-75' : ''}`}
        onClick={() => setShowEditForm(true)}
      >
        <div className="flex items-start space-x-2 md:space-x-3">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              toggleComplete();
            }}
            className="mt-0.5 text-stone-400 transition-colors duration-200"
            style={{ '--hover-color': '#D97757' }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#D97757'}
            onMouseLeave={(e) => e.currentTarget.style.color = ''}
          >
            {isCompleted ? (
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            ) : (
              <Circle className="w-5 h-5" />
            )}
          </button>
          
          <div className="flex-1 min-w-0">
            <h3 className={`text-sm md:text-base font-medium text-stone-100 ${isCompleted ? 'line-through' : ''}`}>
              {task.title}
            </h3>
            {task.description && (
              <p className="text-xs md:text-sm text-stone-400 mt-1">{task.description}</p>
            )}
            
            <div className="flex items-center space-x-2 md:space-x-4 mt-2 md:mt-3">
              <div className="flex items-center space-x-1">
                <Flag className={`w-3 h-3 md:w-4 md:h-4 ${priorityColors[task.priority]}`} />
                <span className="text-xs text-stone-500 capitalize">{task.priority}</span>
              </div>
              
              {task.dueDate && (
                <div className="flex items-center space-x-1">
                  <Calendar className="w-3 h-3 md:w-4 md:h-4 text-stone-400" />
                  <span className="text-xs text-stone-400">
                    {format(task.dueDate, 'MMM d')}
                  </span>
                </div>
              )}
            </div>

            {task.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1 md:mt-2">
                {task.tags.map((tag, index) => (
                  <span 
                    key={index}
                    className="px-1.5 md:px-2 py-0.5 md:py-1 bg-stone-800 text-stone-300 text-xs rounded-lg"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showEditForm && (
        <TaskForm 
          task={task} 
          onClose={() => setShowEditForm(false)} 
        />
      )}
    </>
  );
}