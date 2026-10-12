import React from 'react';
import { useDashboardWidgetStore, WidgetId } from '@/stores/dashboard-widget.store';

interface DraggableWidgetProps {
  id: WidgetId;
  children: React.ReactNode;
  dragLabel?: string;
}

let dragSrcEl: WidgetId | null = null;

export const DraggableWidget: React.FC<DraggableWidgetProps> = ({ id, children, dragLabel }) => {
  const { widgetOrder, reorderWidgets } = useDashboardWidgetStore();
  const order = widgetOrder.indexOf(id);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    dragSrcEl = id;
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (dragSrcEl && dragSrcEl !== id) {
      reorderWidgets(dragSrcEl, id);
    }
    dragSrcEl = null;
  };

  return (
    <div
      style={{ order }}
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {children}
    </div>
  );
};

export const DragHandle: React.FC<{ label?: string }> = ({ label }) => (
  <div
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 24,
      height: 24,
      cursor: 'grab',
      color: '#999',
      fontSize: 14,
      userSelect: 'none',
    }}
    title={label || 'Kéo để sắp xếp'}
  >
    ≡
  </div>
);
