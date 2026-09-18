import { useState, useEffect, useCallback } from 'react';
import { TodoItem, Priority, RecurrenceType, FilterStatus, FilterPriority, FilterCategory, SortOption } from '../types';
import {
  INITIAL_TODOS,
  STORAGE_KEY_TODOS,
  STORAGE_KEY_CATEGORIES,
  PRESET_CATEGORIES,
  getPriorityConfig,
} from '../constants';
import { generateId } from '../utils';
import {
  playAddTaskSound,
  playCompleteTaskSound,
  playDeleteTaskSound,
} from '../utils/sound';
import { triggerSubtleConfetti } from '../utils/confetti';

function calculateNextRecurrenceDate(currentDueDate?: string, recurrence: 'daily' | 'weekly' = 'daily'): string {
  let base: Date;
  if (currentDueDate) {
    const parts = currentDueDate.split('-');
    if (parts.length === 3) {
      base = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    } else {
      base = new Date();
    }
  } else {
    base = new Date();
  }

  if (recurrence === 'daily') {
    base.setDate(base.getDate() + 1);
  } else if (recurrence === 'weekly') {
    base.setDate(base.getDate() + 7);
  }

  const y = base.getFullYear();
  const m = String(base.getMonth() + 1).padStart(2, '0');
  const d = String(base.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function useTodos() {
  const [todos, setTodos] = useState<TodoItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TODOS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((item, index) => {
            let priority: Priority = 'medium';
            if (item.priority === 'low' || item.priority === 'medium' || item.priority === 'high') {
              priority = item.priority;
            } else if (item.priority === 'urgent') {
              priority = 'high';
            }
            return {
              ...item,
              priority,
              category: item.category || 'Personal',
              dueTime: item.dueTime || undefined,
              notifyWhenDue: !!item.notifyWhenDue,
              subtasks: Array.isArray(item.subtasks) ? item.subtasks : [],
              order: typeof item.order === 'number' ? item.order : index,
            };
          });
        }
      }
    } catch {
      // ignore storage parsing error
    }
    return INITIAL_TODOS;
  });

  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterPriority, setFilterPriority] = useState<FilterPriority>('all');
  const [filterCategory, setFilterCategory] = useState<FilterCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('custom');

  const [categories, setCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CATEGORIES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return PRESET_CATEGORIES;
  });

  // Persist todos to localStorage whenever changed
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TODOS, JSON.stringify(todos));
    } catch {
      // ignore storage quota error
    }
  }, [todos]);

  // Persist categories to localStorage whenever changed
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(categories));
    } catch {
      // ignore
    }
  }, [categories]);

  const addCategory = useCallback(
    (name: string): { success: boolean; error?: string } => {
      const trimmed = name.trim();
      if (!trimmed) {
        return { success: false, error: 'Category name cannot be empty' };
      }
      if (trimmed.length > 24) {
        return { success: false, error: 'Category name is too long (max 24 chars)' };
      }
      if (categories.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
        return { success: false, error: 'Category already exists' };
      }
      setCategories((prev) => [...prev, trimmed]);
      return { success: true };
    },
    [categories]
  );

  const renameCategory = useCallback(
    (oldName: string, newName: string): { success: boolean; error?: string } => {
      const trimmedOld = oldName.trim();
      const trimmedNew = newName.trim();
      if (!trimmedNew) {
        return { success: false, error: 'New category name cannot be empty' };
      }
      if (trimmedNew.length > 24) {
        return { success: false, error: 'Category name is too long (max 24 chars)' };
      }
      if (trimmedOld.toLowerCase() === trimmedNew.toLowerCase()) {
        setCategories((prev) =>
          prev.map((c) => (c.toLowerCase() === trimmedOld.toLowerCase() ? trimmedNew : c))
        );
        setTodos((prev) =>
          prev.map((t) =>
            t.category.toLowerCase() === trimmedOld.toLowerCase()
              ? { ...t, category: trimmedNew }
              : t
          )
        );
        if (filterCategory.toLowerCase() === trimmedOld.toLowerCase()) {
          setFilterCategory(trimmedNew);
        }
        return { success: true };
      }
      if (categories.some((c) => c.toLowerCase() === trimmedNew.toLowerCase())) {
        return { success: false, error: 'A category with this name already exists' };
      }

      setCategories((prev) => prev.map((c) => (c === trimmedOld ? trimmedNew : c)));
      setTodos((prev) =>
        prev.map((t) => (t.category === trimmedOld ? { ...t, category: trimmedNew } : t))
      );
      if (filterCategory === trimmedOld) {
        setFilterCategory(trimmedNew);
      }
      return { success: true };
    },
    [categories, filterCategory]
  );

  const deleteCategory = useCallback(
    (
      categoryToDelete: string,
      fallbackCategory?: string
    ): { success: boolean; error?: string } => {
      if (categories.length <= 1) {
        return { success: false, error: 'Cannot delete the only remaining category' };
      }
      const targetFallback =
        fallbackCategory ||
        categories.find((c) => c !== categoryToDelete) ||
        'General';

      setCategories((prev) => prev.filter((c) => c !== categoryToDelete));
      setTodos((prev) =>
        prev.map((t) =>
          t.category === categoryToDelete ? { ...t, category: targetFallback } : t
        )
      );
      if (filterCategory === categoryToDelete) {
        setFilterCategory('all');
      }
      return { success: true };
    },
    [categories, filterCategory]
  );

  const resetCategoriesToDefault = useCallback(() => {
    setCategories(PRESET_CATEGORIES);
  }, []);

  const addTodo = useCallback(
    (
      title: string,
      category: string = 'Work',
      priority: Priority = 'medium',
      dueDate?: string,
      dueTime?: string,
      description?: string,
      notifyWhenDue?: boolean,
      recurrence?: RecurrenceType
    ) => {
      if (!title.trim()) return;

      playAddTaskSound();

      setTodos((prev) => {
        const minOrder = prev.reduce((min, t) => Math.min(min, t.order ?? 0), 0);
        const newTask: TodoItem = {
          id: generateId(),
          title: title.trim(),
          description: description?.trim() ? description.trim() : undefined,
          completed: false,
          category: category.trim() || 'General',
          priority,
          dueDate: dueDate || undefined,
          dueTime: dueTime || undefined,
          notifyWhenDue: !!notifyWhenDue,
          recurrence: recurrence && recurrence !== 'none' ? recurrence : undefined,
          createdAt: new Date().toISOString(),
          order: minOrder - 1,
        };
        return [newTask, ...prev];
      });
    },
    []
  );

  const toggleTodo = useCallback((id: string) => {
    setTodos((prev) => {
      let isCompleting = false;
      const todayStr = new Date().toISOString().split('T')[0];

      const next = prev.map((todo) => {
        if (todo.id === id) {
          const nextCompleted = !todo.completed;
          if (nextCompleted) {
            isCompleting = true;
            playCompleteTaskSound();
          }

          // If completing a recurring task (daily or weekly), advance due date to next cycle
          if (nextCompleted && todo.recurrence && todo.recurrence !== 'none') {
            const nextDueDate = calculateNextRecurrenceDate(todo.dueDate, todo.recurrence);
            return {
              ...todo,
              completed: false, // Keep active and advance to next recurrence cycle
              dueDate: nextDueDate,
              completedAt: new Date().toISOString(),
              subtasks: todo.subtasks?.map((st) => ({ ...st, completed: false })),
            };
          }

          return {
            ...todo,
            completed: nextCompleted,
            completedAt: nextCompleted ? new Date().toISOString() : undefined,
          };
        }
        return todo;
      });

      if (isCompleting) {
        // Condition 1: Check if all tasks for today are now completed
        const todayTasks = next.filter(
          (t) => t.dueDate === todayStr || (t.createdAt && t.createdAt.split('T')[0] === todayStr)
        );
        const allTodayCompleted = todayTasks.length > 0 && todayTasks.every((t) => t.completed);
        const prevHadPendingToday = prev.some(
          (t) => (t.dueDate === todayStr || (t.createdAt && t.createdAt.split('T')[0] === todayStr)) && !t.completed
        );

        // Condition 2: Check if all tasks in the list are now completely finished
        const allTotalCompleted = next.length > 0 && next.every((t) => t.completed);
        const prevHadPendingTotal = prev.some((t) => !t.completed);

        if ((allTodayCompleted && prevHadPendingToday) || (allTotalCompleted && prevHadPendingTotal)) {
          // Slight delay to sync with task completion chime & checkbox checkmark animation
          setTimeout(() => {
            triggerSubtleConfetti();
          }, 180);
        }
      }

      return next;
    });
  }, []);

  const editTodo = useCallback((id: string, updates: Partial<Omit<TodoItem, 'id' | 'createdAt'>>) => {
    setTodos((prev) =>
      prev.map((todo) => {
        if (todo.id === id) {
          return { ...todo, ...updates };
        }
        return todo;
      })
    );
  }, []);

  // Subtask management
  const addSubtask = useCallback((todoId: string, title: string) => {
    if (!title.trim()) return;
    setTodos((prev) =>
      prev.map((todo) => {
        if (todo.id === todoId) {
          const newSubtask = {
            id: generateId(),
            title: title.trim(),
            completed: false,
          };
          return {
            ...todo,
            subtasks: [...(todo.subtasks || []), newSubtask],
          };
        }
        return todo;
      })
    );
  }, []);

  const toggleSubtask = useCallback((todoId: string, subtaskId: string) => {
    setTodos((prev) =>
      prev.map((todo) => {
        if (todo.id === todoId && todo.subtasks) {
          const updatedSubtasks = todo.subtasks.map((st) =>
            st.id === subtaskId ? { ...st, completed: !st.completed } : st
          );
          return {
            ...todo,
            subtasks: updatedSubtasks,
          };
        }
        return todo;
      })
    );
  }, []);

  const deleteSubtask = useCallback((todoId: string, subtaskId: string) => {
    setTodos((prev) =>
      prev.map((todo) => {
        if (todo.id === todoId && todo.subtasks) {
          return {
            ...todo,
            subtasks: todo.subtasks.filter((st) => st.id !== subtaskId),
          };
        }
        return todo;
      })
    );
  }, []);

  const editSubtask = useCallback((todoId: string, subtaskId: string, title: string) => {
    if (!title.trim()) return;
    setTodos((prev) =>
      prev.map((todo) => {
        if (todo.id === todoId && todo.subtasks) {
          return {
            ...todo,
            subtasks: todo.subtasks.map((st) =>
              st.id === subtaskId ? { ...st, title: title.trim() } : st
            ),
          };
        }
        return todo;
      })
    );
  }, []);

  // Data Export & Import
  const exportData = useCallback(() => {
    const backup = {
      appName: 'DIO To-Do List',
      version: 1,
      exportedAt: new Date().toISOString(),
      todos,
      categories,
    };
    return JSON.stringify(backup, null, 2);
  }, [todos, categories]);

  const importData = useCallback(
    (jsonData: string, mode: 'replace' | 'merge' = 'replace'): { success: boolean; count: number; error?: string } => {
      try {
        const parsed = JSON.parse(jsonData);
        const importedTodos: TodoItem[] = Array.isArray(parsed)
          ? parsed
          : Array.isArray(parsed.todos)
          ? parsed.todos
          : [];

        if (importedTodos.length === 0 && !Array.isArray(parsed.categories)) {
          return { success: false, count: 0, error: 'No valid tasks or categories found in JSON' };
        }

        const sanitizedTodos: TodoItem[] = importedTodos.map((item, idx) => ({
          id: item.id || generateId(),
          title: String(item.title || 'Untitled Task'),
          description: item.description ? String(item.description) : undefined,
          completed: Boolean(item.completed),
          category: String(item.category || 'General'),
          priority: (['low', 'medium', 'high'].includes(item.priority) ? item.priority : 'medium') as Priority,
          dueDate: item.dueDate ? String(item.dueDate) : undefined,
          dueTime: item.dueTime ? String(item.dueTime) : undefined,
          notifyWhenDue: Boolean(item.notifyWhenDue),
          subtasks: Array.isArray(item.subtasks)
            ? item.subtasks.map((st) => ({
                id: st.id || generateId(),
                title: String(st.title || 'Subtask'),
                completed: Boolean(st.completed),
              }))
            : [],
          createdAt: item.createdAt || new Date().toISOString(),
          completedAt: item.completedAt || undefined,
          order: typeof item.order === 'number' ? item.order : idx,
        }));

        if (mode === 'replace') {
          setTodos(sanitizedTodos);
          if (Array.isArray(parsed.categories) && parsed.categories.length > 0) {
            setCategories(parsed.categories);
          }
        } else {
          // Merge mode: keep existing, append new non-duplicate
          setTodos((prev) => {
            const existingIds = new Set(prev.map((t) => t.id));
            const newTasks = sanitizedTodos.filter((t) => !existingIds.has(t.id));
            return [...prev, ...newTasks];
          });
          if (Array.isArray(parsed.categories)) {
            setCategories((prev) => Array.from(new Set([...prev, ...parsed.categories])));
          }
        }

        return { success: true, count: sanitizedTodos.length };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Invalid JSON file format';
        return { success: false, count: 0, error: message };
      }
    },
    []
  );

  const deleteTodo = useCallback((id: string) => {
    playDeleteTaskSound();
    setTodos((prev) => prev.filter((todo) => todo.id !== id));
  }, []);

  const clearCompleted = useCallback(() => {
    playDeleteTaskSound();
    setTodos((prev) => prev.filter((todo) => !todo.completed));
  }, []);

  const batchDelete = useCallback((ids: string[]) => {
    if (ids.length === 0) return;
    playDeleteTaskSound();
    const idSet = new Set(ids);
    setTodos((prev) => prev.filter((todo) => !idSet.has(todo.id)));
  }, []);

  const batchMarkComplete = useCallback((ids: string[], completed: boolean = true) => {
    if (ids.length === 0) return;
    if (completed) {
      playCompleteTaskSound();
    }
    const idSet = new Set(ids);
    setTodos((prev) => {
      const next = prev.map((todo) => {
        if (idSet.has(todo.id)) {
          return {
            ...todo,
            completed,
            completedAt: completed ? new Date().toISOString() : undefined,
          };
        }
        return todo;
      });

      if (completed) {
        const allCompleted = next.length > 0 && next.every((t) => t.completed);
        const prevHadPending = prev.some((t) => !t.completed);
        if (allCompleted && prevHadPending) {
          setTimeout(() => {
            triggerSubtleConfetti();
          }, 180);
        }
      }

      return next;
    });
  }, []);

  const batchUpdatePriority = useCallback((ids: string[], priority: Priority) => {
    if (ids.length === 0) return;
    const idSet = new Set(ids);
    setTodos((prev) =>
      prev.map((todo) => {
        if (idSet.has(todo.id)) {
          return {
            ...todo,
            priority,
          };
        }
        return todo;
      })
    );
  }, []);

  const reorderTodos = useCallback((draggedId: string, targetId: string) => {
    if (draggedId === targetId) return;

    setTodos((prev) => {
      const fromIndex = prev.findIndex((t) => t.id === draggedId);
      const toIndex = prev.findIndex((t) => t.id === targetId);
      if (fromIndex === -1 || toIndex === -1) return prev;

      const newItems = [...prev];
      const [movedItem] = newItems.splice(fromIndex, 1);
      newItems.splice(toIndex, 0, movedItem);

      // Reassign sequential orders
      return newItems.map((item, idx) => ({
        ...item,
        order: idx,
      }));
    });
  }, []);

  // Filter and sort items
  const filteredTodos = todos
    .filter((todo) => {
      // Filter status: all, pending, completed
      if (filterStatus === 'pending' && todo.completed) return false;
      if (filterStatus === 'completed' && !todo.completed) return false;

      // Filter priority
      if (filterPriority !== 'all' && todo.priority !== filterPriority) return false;

      // Filter category
      if (filterCategory !== 'all' && todo.category !== filterCategory) return false;

      // Search query (title, description, category)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const titleMatches = todo.title.toLowerCase().includes(query);
        const descMatches = todo.description?.toLowerCase().includes(query) ?? false;
        const catMatches = todo.category.toLowerCase().includes(query);
        if (!titleMatches && !descMatches && !catMatches) return false;
      }
      return true;
    })
    .sort((a, b) => {
      // If custom sort, preserve order property
      if (sortBy === 'custom') {
        return (a.order ?? 0) - (b.order ?? 0);
      }

      // If non-custom sort, sort completed to bottom
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }

      switch (sortBy) {
        case 'priority': {
          const weightA = getPriorityConfig(a.priority).weight;
          const weightB = getPriorityConfig(b.priority).weight;
          return weightB - weightA;
        }
        case 'dueDate': {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          const dateComp = a.dueDate.localeCompare(b.dueDate);
          if (dateComp !== 0) return dateComp;
          return (a.dueTime || '23:59').localeCompare(b.dueTime || '23:59');
        }
        case 'alphabetical':
          return a.title.localeCompare(b.title);
        case 'createdAt':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return (a.order ?? 0) - (b.order ?? 0);
      }
    });

  const totalCount = todos.length;
  const completedCount = todos.filter((t) => t.completed).length;
  const pendingCount = totalCount - completedCount;

  // Extract all unique categories present in tasks + custom/preset categories
  const allCategories = Array.from(
    new Set([...categories, ...todos.map((t) => t.category).filter(Boolean)])
  );

  return {
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
    addSubtask,
    toggleSubtask,
    deleteSubtask,
    editSubtask,
    exportData,
    importData,
    reorderTodos,
    clearCompleted,
    batchDelete,
    batchMarkComplete,
    batchUpdatePriority,
  };
}
