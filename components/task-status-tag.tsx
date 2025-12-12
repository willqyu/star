'use client';

import { useState } from 'react';
import { toast } from 'sonner';

interface TaskStatusTagProps {
  taskId: string;
  taskStatus: 'waiting_for_them' | 'waiting_for_me' | 'on_hold';
  onStatusChange?: (newStatus: 'waiting_for_them' | 'waiting_for_me' | 'on_hold') => void;
  isClickable?: boolean;
  compact?: boolean;
}

const statusConfig = {
  waiting_for_them: {
    label: 'Waiting for them',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    nextStatus: 'waiting_for_me' as const,
  },
  waiting_for_me: {
    label: 'Waiting for me',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
    nextStatus: 'waiting_for_them' as const,
  },
  on_hold: {
    label: 'On Hold',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-800',
    nextStatus: null,
  },
};

export function TaskStatusTag({
  taskId,
  taskStatus,
  onStatusChange,
  isClickable = true,
  compact = false,
}: TaskStatusTagProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Ensure taskStatus is a valid key in statusConfig
  const validStatuses: Array<'waiting_for_them' | 'waiting_for_me' | 'on_hold'> = ['waiting_for_them', 'waiting_for_me', 'on_hold'];
  const normalizedStatus = validStatuses.includes(taskStatus) ? taskStatus : 'waiting_for_them';
  
  const config = statusConfig[normalizedStatus];

  const handleStatusToggle = async () => {
    if (!isClickable || isUpdating) return;

    const nextStatus = config.nextStatus;
    if (!nextStatus) return; // Can't toggle from on_hold

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ task_status: nextStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update task status');
      }

      const data = await response.json();
      onStatusChange?.(data.task_status);
      toast.success(`Status changed to ${statusConfig[nextStatus].label}`);
    } catch (error) {
      console.error('Failed to update task status:', error);
      toast.error('Failed to update task status');
    } finally {
      setIsUpdating(false);
    }
  };

  const paddingClass = compact ? 'px-2 py-0.5' : 'px-3 py-1';
  const textSizeClass = compact ? 'text-xs' : 'text-sm';
  const cursorClass =
    isClickable && config.nextStatus ? 'cursor-pointer hover:opacity-80' : 'cursor-default';

  return (
    <span
      onClick={handleStatusToggle}
      className={`inline-flex items-center ${paddingClass} rounded-full ${config.bgColor} ${config.textColor} ${textSizeClass} font-medium transition-opacity ${cursorClass}`}
      title={
        isClickable && config.nextStatus
          ? `Click to toggle to "${statusConfig[config.nextStatus].label}"`
          : 'On Hold status can only be changed in edit mode'
      }
    >
      {isUpdating ? 'Updating...' : config.label}
    </span>
  );
}
