/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useTodos } from './hooks/useTodos';
import { useTheme } from './hooks/useTheme';
import { Header } from './components/Header';
import { TaskInput } from './components/TaskInput';
import { TaskFilters } from './components/TaskFilters';
import { TaskItem } from './components/TaskItem';
import { EmptyState } from './components/EmptyState';
import { DailyProductivityDashboard } from './components/DailyProductivityDashboard';
import { BatchActionBar } from './components/BatchActionBar';
import { ToastNotificationSystem } from './components/ToastNotificationSystem';
import { ManageCategoriesModal } from './components/ManageCategoriesModal';
import { CalendarView } from './components/CalendarView';
import { ScrollToTopButton } from './components/ScrollToTopButton';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { Priority, ViewMode } from './types';
import {
  hapticDragStart,
  hapticDragOver,
  hapticDragDrop,
  hapticButtonClick,
} from './utils/haptics';

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const {
    todos,
    filteredTodos,
    totalCount,
    completedCount,
    pendingCount,
    filterStatus,
    setFilterStatus,
    filterPriority,
    setFilterPriority,
    filterCategory,
    setFilterCategory,
    categories,
    allCategories,
    addCategory,
    renameCategory,
    deleteCategory,
    resetCategoriesToDefault,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    addTodo,
    toggleTodo,
    editTodo,
    deleteTodo,
    reorderTodos,
    clearCompleted,
    batchDelete,
    batchMarkComplete,
    batchUpdatePriority,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
    exportData,
    importData,
  } = useTodos();

  const { theme, isDark, toggleTheme } = useTheme();

  // Drag and drop state
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  // Selection mode & batch operations state
  const [isSelectionMode, setIsSelectionMode] = useState<boolean>(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [reopenTrigger, setReopenTrigger] = useState<number>(0);

  // Manage Categories modal state
  const [isManageCategoriesOpen, setIsManageCategoriesOpen] = useState<boolean>(false);
  // Keyboard Shortcuts modal state
  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);

  // Global Keyboard Shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      // Handle Escape key
      if (e.key === 'Escape') {
        if (isShortcutsOpen) {
          setIsShortcutsOpen(false);
          return;
        }
        if (isManageCategoriesOpen) {
          setIsManageCategoriesOpen(false);
          return;
        }
      }

      // Skip shortcut keys when typing inside an input/textarea
      if (isInput) return;

      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
      } else if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        const inputEl = document.getElementById('task-title-input') || document.querySelector('input[type="text"]');
        if (inputEl instanceof HTMLElement) {
          inputEl.focus();
        }
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        const searchEl = document.getElementById('search-tasks-input');
        if (searchEl instanceof HTMLElement) {
          searchEl.focus();
        }
      } else if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        setViewMode((prev) => (prev === 'list' ? 'calendar' : 'list'));
      } else if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        toggleTheme();
      } else if (e.key === '1') {
        e.preventDefault();
        setFilterStatus('all');
      } else if (e.key === '2') {
        e.preventDefault();
        setFilterStatus('pending');
      } else if (e.key === '3') {
        e.preventDefault();
        setFilterStatus('completed');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isShortcutsOpen, isManageCategoriesOpen, toggleTheme, setFilterStatus]);

  // Compute count of imminent or overdue tasks
  const alertCount = todos.filter((todo) => {
    if (todo.completed || !todo.dueDate) return false;
    const timePart = todo.dueTime ? `${todo.dueTime}:00` : '23:59:59';
    const dueTimestamp = new Date(`${todo.dueDate}T${timePart}`).getTime();
    if (isNaN(dueTimestamp)) return false;
    const diffMs = dueTimestamp - Date.now();
    return diffMs < 0 || diffMs <= 60 * 60 * 1000;
  }).length;

  const handleToggleSelectionMode = () => {
    setIsSelectionMode((prev) => {
      const next = !prev;
      if (!next) {
        setSelectedIds(new Set());
      }
      return next;
    });
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
    if (!isSelectionMode) {
      setIsSelectionMode(true);
    }
  };

  const handleSelectAll = () => {
    setSelectedIds(new Set(filteredTodos.map((t) => t.id)));
  };

  const handleDeselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleExitSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedIds(new Set());
  };

  const handleAddTaskWithDate = (title: string, date: string) => {
    addTodo(title, 'Work', 'medium', date, '', '', true);
  };

  const handleBatchComplete = (completed: boolean) => {
    const ids = Array.from(selectedIds);
    batchMarkComplete(ids, completed);
    setSelectedIds(new Set());
    setIsSelectionMode(false);
  };

  const handleBatchUpdatePriority = (priority: Priority) => {
    const ids = Array.from(selectedIds);
    batchUpdatePriority(ids, priority);
    setSelectedIds(new Set());
    setIsSelectionMode(false);
  };

  const handleBatchDelete = () => {
    const ids = Array.from(selectedIds);
    batchDelete(ids);
    setSelectedIds(new Set());
    setIsSelectionMode(false);
  };

  const allFilteredSelected =
    filteredTodos.length > 0 &&
    filteredTodos.every((t) => selectedIds.has(t.id));

  const handleResetFilters = () => {
    setFilterStatus('all');
    setFilterPriority('all');
    setFilterCategory('all');
    setSearchQuery('');
  };

  const handleDragStartItem = (id: string) => {
    if (isSelectionMode) return;
    hapticDragStart();
    setDraggedId(id);
  };

  const handleDragOverItem = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (isSelectionMode) return;
    if (draggedId && draggedId !== id) {
      if (dragOverId !== id) {
        hapticDragOver();
      }
      setDragOverId(id);
    }
  };

  const handleDropItem = (targetId: string) => {
    if (isSelectionMode) return;
    if (draggedId && draggedId !== targetId) {
      hapticDragDrop();
      reorderTodos(draggedId, targetId);
    }
    setDraggedId(null);
    setDragOverId(null);
  };

  const handleTouchStartItem = (id: string) => {
    if (isSelectionMode) return;
    hapticDragStart();
    setDraggedId(id);
  };

  const handleTouchMoveItem = (e: React.TouchEvent) => {
    if (isSelectionMode || !draggedId) return;
    const touch = e.touches[0];
    if (!touch) return;
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const taskItem = element?.closest('[data-task-id]');
    const targetId = taskItem?.getAttribute('data-task-id');
    if (targetId && targetId !== draggedId) {
      if (dragOverId !== targetId) {
        hapticDragOver();
        setDragOverId(targetId);
      }
    }
  };

  const handleTouchEndItem = () => {
    if (isSelectionMode || !draggedId) return;
    if (dragOverId && dragOverId !== draggedId) {
      hapticDragDrop();
      reorderTodos(draggedId, dragOverId);
    }
    setDraggedId(null);
    setDragOverId(null);
  };

  return (
    <div className="min-h-screen bg-zinc-100/60 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 transition-colors duration-200 antialiased flex flex-col justify-between">
      {/* Toast Notification System for Imminent and Overdue Tasks */}
      <ToastNotificationSystem
        todos={todos}
        onToggleComplete={toggleTodo}
        reopenTrigger={reopenTrigger}
      />

      <main className="max-w-2xl w-full mx-auto px-4 py-8 sm:py-12 flex-1">
        {/* Minimalist Header with Dark Mode Toggle and Progress Bar */}
        <Header
          totalCount={totalCount}
          completedCount={completedCount}
          isDark={isDark}
          theme={theme}
          onToggleTheme={toggleTheme}
          alertCount={alertCount}
          onTriggerAlerts={() => setReopenTrigger((prev) => prev + 1)}
          activeTasks={todos.filter((t) => !t.completed)}
          onCompleteTask={toggleTodo}
          onOpenManageCategories={() => setIsManageCategoriesOpen(true)}
          onExportData={exportData}
          onImportData={importData}
          onOpenShortcuts={() => setIsShortcutsOpen(true)}
        />

        {/* Task Input Component with Category Tags, Priority, Due Date & Time, and Voice Subtask Commands */}
        <TaskInput
          onAddTask={addTodo}
          categories={categories}
          onOpenManageCategories={() => setIsManageCategoriesOpen(true)}
          todos={todos}
          onAddSubtask={addSubtask}
        />

        {/* Search Bar, Filter Tabs (All, Pending, Completed), Categories, and Sort Options */}
        <TaskFilters
          totalCount={totalCount}
          pendingCount={pendingCount}
          completedCount={completedCount}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          filterPriority={filterPriority}
          setFilterPriority={setFilterPriority}
          filterCategory={filterCategory}
          setFilterCategory={setFilterCategory}
          allCategories={allCategories}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          sortBy={sortBy}
          setSortBy={setSortBy}
          onClearCompleted={clearCompleted}
          isSelectionMode={isSelectionMode}
          onToggleSelectionMode={handleToggleSelectionMode}
          onOpenManageCategories={() => setIsManageCategoriesOpen(true)}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        {/* Small Data Visualization Dashboard - Daily Productivity Chart using Recharts */}
        <DailyProductivityDashboard todos={todos} isDark={isDark} />

        {/* Main Content: Calendar View vs List View */}
        {viewMode === 'calendar' ? (
          <CalendarView
            todos={filteredTodos}
            onToggle={toggleTodo}
            onDelete={deleteTodo}
            onEdit={editTodo}
            onAddTaskWithDate={handleAddTaskWithDate}
            onAddSubtask={addSubtask}
            onToggleSubtask={toggleSubtask}
            onDeleteSubtask={deleteSubtask}
            categories={categories}
          />
        ) : (
          /* Task List with Drag-and-Drop Reordering and Transitions */
          <div className="relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${filterStatus}-${filterCategory}-${filterPriority}`}
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              >
                {filteredTodos.length > 0 ? (
                  <ul
                    id="task-list"
                    className="space-y-2.5"
                    onDragLeave={() => setDragOverId(null)}
                  >
                    <AnimatePresence initial={false} mode="popLayout">
                      {filteredTodos.map((todo) => (
                        <TaskItem
                          key={todo.id}
                          todo={todo}
                          onToggle={toggleTodo}
                          onDelete={deleteTodo}
                          onEdit={editTodo}
                          categories={categories}
                          onAddSubtask={addSubtask}
                          onToggleSubtask={toggleSubtask}
                          onDeleteSubtask={deleteSubtask}
                          onDragStartItem={handleDragStartItem}
                          onDragOverItem={handleDragOverItem}
                          onDropItem={handleDropItem}
                          onTouchStartItem={handleTouchStartItem}
                          onTouchMoveItem={handleTouchMoveItem}
                          onTouchEndItem={handleTouchEndItem}
                          isDragOver={dragOverId === todo.id}
                          isSelectionMode={isSelectionMode}
                          isSelected={selectedIds.has(todo.id)}
                          onToggleSelect={handleToggleSelect}
                        />
                      ))}
                    </AnimatePresence>
                  </ul>
                ) : (
                  <EmptyState
                    totalCount={totalCount}
                    filterStatus={filterStatus}
                    filterPriority={filterPriority}
                    filterCategory={filterCategory}
                    searchQuery={searchQuery}
                    onResetFilters={handleResetFilters}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Floating Sticky Batch Operations Toolbar when selection mode is active */}
      {isSelectionMode && (
        <BatchActionBar
          selectedCount={selectedIds.size}
          totalFilteredCount={filteredTodos.length}
          allSelected={allFilteredSelected}
          onSelectAll={handleSelectAll}
          onDeselectAll={handleDeselectAll}
          onBatchComplete={handleBatchComplete}
          onBatchUpdatePriority={handleBatchUpdatePriority}
          onBatchDelete={handleBatchDelete}
          onExitSelectionMode={handleExitSelectionMode}
        />
      )}

      {/* Manage Custom Categories Modal */}
      <ManageCategoriesModal
        isOpen={isManageCategoriesOpen}
        onClose={() => setIsManageCategoriesOpen(false)}
        categories={categories}
        todos={todos}
        onAddCategory={addCategory}
        onRenameCategory={renameCategory}
        onDeleteCategory={deleteCategory}
        onResetCategories={resetCategoriesToDefault}
      />

      {/* Keyboard Shortcuts Cheat Sheet Modal */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* Footer: Powered by DIO Pakistan */}
      <footer
        id="app-footer"
        className="w-full py-6 text-center text-xs font-medium tracking-wide text-zinc-400 dark:text-zinc-500 border-t border-zinc-200/60 dark:border-zinc-800/60"
      >
        Powered by{' '}
        <a
          href="https://www.diopakistan.com"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors underline underline-offset-4"
        >
          DIO Pakistan
        </a>
      </footer>

      {/* Floating Scroll to Top Button */}
      <ScrollToTopButton />
    </div>
  );
}
