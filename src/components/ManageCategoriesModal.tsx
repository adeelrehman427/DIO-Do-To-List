import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Tag,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  AlertCircle,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { getCategoryConfig } from '../constants';
import { TodoItem } from '../types';
import { hapticButtonClick, hapticDelete } from '../utils/haptics';

interface ManageCategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: string[];
  todos: TodoItem[];
  onAddCategory: (name: string) => { success: boolean; error?: string };
  onRenameCategory: (oldName: string, newName: string) => { success: boolean; error?: string };
  onDeleteCategory: (name: string, fallbackCategory?: string) => { success: boolean; error?: string };
  onResetCategories: () => void;
}

export const ManageCategoriesModal: React.FC<ManageCategoriesModalProps> = ({
  isOpen,
  onClose,
  categories,
  todos,
  onAddCategory,
  onRenameCategory,
  onDeleteCategory,
  onResetCategories,
}) => {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [addError, setAddError] = useState<string | null>(null);

  // Inline editing state
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editInputName, setEditInputName] = useState('');
  const [editError, setEditError] = useState<string | null>(null);

  // Category deletion confirmation state
  const [deletingCategory, setDeletingCategory] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // Count tasks per category
  const taskCountMap = React.useMemo(() => {
    const map = new Map<string, number>();
    todos.forEach((t) => {
      const cat = t.category || 'General';
      map.set(cat, (map.get(cat) || 0) + 1);
    });
    return map;
  }, [todos]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setAddError(null);
      setEditingCategory(null);
      setDeletingCategory(null);
      setNewCategoryName('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // ESC key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (editingCategory) {
          setEditingCategory(null);
        } else if (deletingCategory) {
          setDeletingCategory(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, editingCategory, deletingCategory, onClose]);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    if (!newCategoryName.trim()) {
      setAddError('Please enter a category name');
      return;
    }

    const res = onAddCategory(newCategoryName.trim());
    if (res.success) {
      hapticButtonClick();
      setNewCategoryName('');
      setAddError(null);
    } else {
      setAddError(res.error || 'Failed to add category');
    }
  };

  const startEditing = (cat: string) => {
    hapticButtonClick();
    setEditingCategory(cat);
    setEditInputName(cat);
    setEditError(null);
    setDeletingCategory(null);
  };

  const handleSaveRename = (oldName: string) => {
    setEditError(null);
    if (!editInputName.trim()) {
      setEditError('Category name cannot be empty');
      return;
    }

    const res = onRenameCategory(oldName, editInputName.trim());
    if (res.success) {
      hapticButtonClick();
      setEditingCategory(null);
      setEditError(null);
    } else {
      setEditError(res.error || 'Failed to rename category');
    }
  };

  const confirmDelete = (cat: string) => {
    const tasksUsing = taskCountMap.get(cat) || 0;
    if (tasksUsing > 0) {
      // Show confirmation prompt
      hapticButtonClick();
      setDeletingCategory(cat);
    } else {
      // Delete directly
      executeDelete(cat);
    }
  };

  const executeDelete = (cat: string) => {
    hapticDelete();
    onDeleteCategory(cat);
    setDeletingCategory(null);
  };

  if (!isOpen) return null;

  return (
    <div
      id="manage-categories-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          hapticButtonClick();
          onClose();
        }
      }}
    >
      <motion.div
        id="manage-categories-modal"
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 p-4 sm:p-5 dark:border-zinc-800/80">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400">
              <Tag className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                Manage Categories
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Create, rename, or remove task tags
              </p>
            </div>
          </div>

          <button
            type="button"
            id="close-categories-modal-btn"
            onClick={() => {
              hapticButtonClick();
              onClose();
            }}
            aria-label="Close categories modal"
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Add Category Input Form */}
          <div>
            <label
              htmlFor="new-category-input"
              className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5"
            >
              Add New Category
            </label>
            <form onSubmit={handleAddSubmit} className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">
                  #
                </span>
                <input
                  ref={inputRef}
                  id="new-category-input"
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => {
                    setNewCategoryName(e.target.value);
                    if (addError) setAddError(null);
                  }}
                  placeholder="e.g., Marketing, Finance, Fitness"
                  maxLength={24}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/70 py-2 pl-7 pr-3 text-xs font-medium text-zinc-900 placeholder:text-zinc-400 focus:border-sky-500 focus:bg-white focus:outline-hidden dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-sky-400 dark:focus:bg-zinc-800"
                />
              </div>

              <button
                type="submit"
                id="add-category-btn"
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 transition-all cursor-pointer shrink-0"
              >
                <Plus className="h-4 w-4 stroke-[2.5]" />
                <span>Add</span>
              </button>
            </form>

            {addError && (
              <p className="mt-1.5 flex items-center gap-1 text-xs text-rose-500">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{addError}</span>
              </p>
            )}
          </div>

          {/* Categories List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Active Categories ({categories.length})
              </span>
              <span className="text-[11px] text-zinc-400">
                Renaming updates matching tasks
              </span>
            </div>

            <div className="space-y-1.5">
              {categories.map((cat) => {
                const config = getCategoryConfig(cat);
                const taskCount = taskCountMap.get(cat) || 0;
                const isEditing = editingCategory === cat;
                const isDeleting = deletingCategory === cat;

                return (
                  <div
                    key={cat}
                    className="flex flex-col rounded-xl border border-zinc-200/80 bg-zinc-50/50 p-2.5 transition-all dark:border-zinc-800/80 dark:bg-zinc-800/40"
                  >
                    {isDeleting ? (
                      /* Deletion Confirmation View */
                      <div className="space-y-2 py-1">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                          <AlertCircle className="h-4 w-4 shrink-0" />
                          <span>
                            Delete <strong>#{cat}</strong>? {taskCount} task{taskCount === 1 ? '' : 's'} will be moved to <strong>#General</strong>.
                          </span>
                        </div>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              hapticButtonClick();
                              setDeletingCategory(null);
                            }}
                            className="rounded-lg px-2.5 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-200/60 dark:text-zinc-400 dark:hover:bg-zinc-700/60 cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            id={`confirm-delete-cat-${cat.toLowerCase()}`}
                            onClick={() => executeDelete(cat)}
                            className="rounded-lg bg-rose-600 px-3 py-1 text-xs font-bold text-white hover:bg-rose-700 shadow-xs cursor-pointer"
                          >
                            Yes, Delete
                          </button>
                        </div>
                      </div>
                    ) : isEditing ? (
                      /* Inline Rename Mode */
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-zinc-400">#</span>
                          <input
                            type="text"
                            value={editInputName}
                            onChange={(e) => {
                              setEditInputName(e.target.value);
                              if (editError) setEditError(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSaveRename(cat);
                              } else if (e.key === 'Escape') {
                                setEditingCategory(null);
                              }
                            }}
                            maxLength={24}
                            autoFocus
                            className="flex-1 rounded-lg border border-sky-400 bg-white py-1 px-2 text-xs font-semibold text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100 focus:outline-hidden"
                          />

                          <button
                            type="button"
                            id={`save-rename-cat-${cat.toLowerCase()}`}
                            onClick={() => handleSaveRename(cat)}
                            title="Save category name"
                            className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors cursor-pointer"
                          >
                            <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              hapticButtonClick();
                              setEditingCategory(null);
                            }}
                            title="Cancel rename"
                            className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-200 text-zinc-600 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {editError && (
                          <p className="text-[11px] text-rose-500">{editError}</p>
                        )}
                      </div>
                    ) : (
                      /* Standard Row View */
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold border ${config.badgeBg} ${config.badgeText} ${config.darkBadgeBg} ${config.darkBadgeText}`}
                          >
                            #{cat}
                          </span>

                          <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 shrink-0">
                            {taskCount} {taskCount === 1 ? 'task' : 'tasks'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {/* Rename Button */}
                          <button
                            type="button"
                            id={`rename-category-${cat.toLowerCase()}`}
                            onClick={() => startEditing(cat)}
                            title={`Rename #${cat}`}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-200/70 hover:text-zinc-700 dark:text-zinc-500 dark:hover:bg-zinc-700/60 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            id={`delete-category-${cat.toLowerCase()}`}
                            onClick={() => confirmDelete(cat)}
                            disabled={categories.length <= 1}
                            title={
                              categories.length <= 1
                                ? 'Cannot delete the only category'
                                : `Delete #${cat}`
                            }
                            className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors cursor-pointer ${
                              categories.length <= 1
                                ? 'text-zinc-300 dark:text-zinc-700 cursor-not-allowed'
                                : 'text-zinc-400 hover:bg-rose-50 hover:text-rose-600 dark:text-zinc-500 dark:hover:bg-rose-950/40 dark:hover:text-rose-400'
                            }`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-zinc-100 p-4 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-800/20">
          <button
            type="button"
            id="reset-categories-default-btn"
            onClick={() => {
              hapticButtonClick();
              onResetCategories();
            }}
            title="Restore default preset categories (Work, Personal, Urgent, Study, Health, Home)"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors cursor-pointer"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            id="done-categories-modal-btn"
            onClick={() => {
              hapticButtonClick();
              onClose();
            }}
            className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-4 py-2 text-xs font-bold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 transition-colors cursor-pointer shadow-xs"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
};
