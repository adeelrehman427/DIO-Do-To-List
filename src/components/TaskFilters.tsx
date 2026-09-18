import React from 'react';
import { motion } from 'motion/react';
import { FilterStatus, FilterPriority, FilterCategory, SortOption, Priority, ViewMode } from '../types';
import { PRIORITY_CONFIG, PRESET_CATEGORIES, getCategoryConfig } from '../constants';
import { Search, ArrowUpDown, Trash2, X, Tag, CheckSquare, Settings2, List, Calendar as CalendarIcon } from 'lucide-react';
import { hapticButtonClick } from '../utils/haptics';

interface TaskFiltersProps {
  totalCount: number;
  pendingCount: number;
  completedCount: number;
  filterStatus: FilterStatus;
  setFilterStatus: (status: FilterStatus) => void;
  filterPriority: FilterPriority;
  setFilterPriority: (priority: FilterPriority) => void;
  filterCategory: FilterCategory;
  setFilterCategory: (category: FilterCategory) => void;
  allCategories: string[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortBy: SortOption;
  setSortBy: (sort: SortOption) => void;
  onClearCompleted: () => void;
  isSelectionMode?: boolean;
  onToggleSelectionMode?: () => void;
  onOpenManageCategories?: () => void;
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
}

export const TaskFilters: React.FC<TaskFiltersProps> = ({
  totalCount,
  pendingCount,
  completedCount,
  filterStatus,
  setFilterStatus,
  filterPriority,
  setFilterPriority,
  filterCategory,
  setFilterCategory,
  allCategories,
  searchQuery,
  setSearchQuery,
  sortBy,
  setSortBy,
  onClearCompleted,
  isSelectionMode = false,
  onToggleSelectionMode,
  onOpenManageCategories,
  viewMode = 'list',
  onViewModeChange,
}) => {
  const statusTabs: { id: FilterStatus; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: totalCount },
    { id: 'pending', label: 'Pending', count: pendingCount },
    { id: 'completed', label: 'Completed', count: completedCount },
  ];

  const combinedCategories = Array.from(
    new Set([...PRESET_CATEGORIES, ...allCategories])
  );

  return (
    <div className="mb-6 space-y-3.5">
      {/* Search Bar and Sort Options */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        {/* Search Bar to find specific tasks quickly */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 dark:text-zinc-500" />
          <input
            id="search-tasks-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks by title, notes, or #tags..."
            className="w-full rounded-xl border border-zinc-200/90 bg-white py-2 pl-9 pr-8 text-xs font-medium text-zinc-900 placeholder:text-zinc-400 shadow-2xs focus:border-zinc-400 focus:outline-hidden dark:border-zinc-800 dark:bg-zinc-900/90 dark:text-zinc-100 dark:placeholder:text-zinc-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* View Mode Toggle: List vs Calendar & Sort Dropdown */}
        <div className="flex items-center gap-2 shrink-0">
          {onViewModeChange && (
            <div
              id="view-mode-toggle"
              className="inline-flex items-center p-0.5 rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-850 shadow-2xs"
            >
              <button
                type="button"
                id="view-toggle-list-btn"
                onClick={() => {
                  hapticButtonClick();
                  onViewModeChange('list');
                }}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-white text-zinc-900 shadow-xs dark:bg-zinc-800 dark:text-zinc-100 font-bold'
                    : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
                aria-label="List view"
                title="List view"
              >
                <List className="h-3.5 w-3.5" />
                <span>List</span>
              </button>
              <button
                type="button"
                id="view-toggle-calendar-btn"
                onClick={() => {
                  hapticButtonClick();
                  onViewModeChange('calendar');
                }}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === 'calendar'
                    ? 'bg-white text-zinc-900 shadow-xs dark:bg-zinc-800 dark:text-zinc-100 font-bold'
                    : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
                aria-label="Calendar view"
                title="Calendar view"
              >
                <CalendarIcon className="h-3.5 w-3.5" />
                <span>Calendar</span>
              </button>
            </div>
          )}

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1 rounded-xl border border-zinc-200 bg-white px-2.5 py-1.5 text-xs text-zinc-700 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
            <ArrowUpDown className="h-3.5 w-3.5 text-zinc-400" />
            <select
              id="sort-tasks-select"
              value={sortBy}
              onChange={(e) => {
                hapticButtonClick();
                setSortBy(e.target.value as SortOption);
              }}
              aria-label="Sort tasks by"
              className="bg-transparent text-xs font-medium focus:outline-hidden cursor-pointer"
            >
              <option value="custom" className="dark:bg-zinc-900">Custom (Drag & Drop)</option>
              <option value="dueDate" className="dark:bg-zinc-900">Due Date & Time</option>
              <option value="priority" className="dark:bg-zinc-900">Priority</option>
              <option value="createdAt" className="dark:bg-zinc-900">Recently Added</option>
              <option value="alphabetical" className="dark:bg-zinc-900">Alphabetical</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Filter Tabs (All, Pending, Completed) with Animated Sliding Highlight and Underline */}
      <div className="flex items-center justify-between border-b border-zinc-200/70 pb-2.5 dark:border-zinc-800/70">
        <div className="flex items-center gap-1 p-1 bg-zinc-200/60 rounded-xl dark:bg-zinc-900/80 relative">
          {statusTabs.map((tab) => {
            const isActive = filterStatus === tab.id;
            return (
              <button
                key={tab.id}
                id={`filter-tab-${tab.id}`}
                type="button"
                onClick={() => {
                  hapticButtonClick();
                  setFilterStatus(tab.id);
                }}
                className={`relative flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors duration-150 cursor-pointer select-none ${
                  isActive
                    ? 'text-zinc-900 dark:text-zinc-100 font-bold'
                    : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
              >
                {/* Responsive background-fill sliding pill */}
                {isActive && (
                  <motion.div
                    layoutId="activeFilterTabBackground"
                    className="absolute inset-0 rounded-lg bg-white shadow-xs dark:bg-zinc-800"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}

                {/* Animated active underline transition */}
                {isActive && (
                  <motion.div
                    layoutId="activeFilterTabUnderline"
                    className="absolute -bottom-0.5 left-2.5 right-2.5 h-[2.5px] rounded-full bg-sky-500 dark:bg-sky-400 shadow-xs"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}

                <span className="relative z-10">{tab.label}</span>
                <span
                  className={`relative z-10 rounded-full px-1.5 py-0.5 text-[10px] font-bold transition-all duration-150 ${
                    isActive
                      ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/70 dark:text-sky-300 ring-1 ring-sky-200/60 dark:ring-sky-800/50'
                      : 'bg-zinc-200/80 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          {totalCount > 0 && onToggleSelectionMode && (
            <button
              type="button"
              id="toggle-selection-mode-btn"
              onClick={() => {
                hapticButtonClick();
                onToggleSelectionMode();
              }}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                isSelectionMode
                  ? 'bg-sky-100 text-sky-700 dark:bg-sky-950/80 dark:text-sky-300 ring-1 ring-sky-300 dark:ring-sky-700'
                  : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200'
              }`}
              title={isSelectionMode ? 'Exit Selection Mode' : 'Select multiple tasks'}
            >
              <CheckSquare className="h-3.5 w-3.5" />
              <span>{isSelectionMode ? 'Done Selecting' : 'Select'}</span>
            </button>
          )}

          {completedCount > 0 && (
            <button
              type="button"
              id="clear-completed-btn"
              onClick={() => {
                hapticButtonClick();
                onClearCompleted();
              }}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-400 hover:text-rose-600 dark:text-zinc-500 dark:hover:text-rose-400 transition-colors cursor-pointer"
            >
              <Trash2 className="h-3 w-3" />
              <span className="hidden sm:inline">Clear completed</span> ({completedCount})
            </button>
          )}
        </div>
      </div>

      {/* Category Tags Filter Row */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
        <span className="text-zinc-400 dark:text-zinc-500 text-[11px] font-medium flex items-center gap-1 shrink-0">
          <Tag className="h-3 w-3" />
          Tags:
        </span>
        <button
          type="button"
          id="filter-category-all"
          onClick={() => {
            hapticButtonClick();
            setFilterCategory('all');
          }}
          className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium transition-all active:scale-95 cursor-pointer ${
            filterCategory === 'all'
              ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold shadow-2xs'
              : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800/60'
          }`}
        >
          All Tags
        </button>
        {combinedCategories.map((cat) => {
          const isSelected = filterCategory === cat;
          const catCfg = getCategoryConfig(cat);
          return (
            <button
              key={cat}
              type="button"
              id={`filter-category-${cat.toLowerCase()}`}
              onClick={() => {
                hapticButtonClick();
                setFilterCategory(isSelected ? 'all' : cat);
              }}
              className={`shrink-0 inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-all active:scale-95 cursor-pointer ${
                isSelected
                  ? 'bg-zinc-900 text-white shadow-xs dark:bg-zinc-100 dark:text-zinc-900 font-semibold'
                  : `${catCfg.badgeBg} ${catCfg.badgeText} ${catCfg.darkBadgeBg} ${catCfg.darkBadgeText} border hover:opacity-80`
              }`}
            >
              #{cat}
            </button>
          );
        })}

        {/* Manage Categories Button */}
        {onOpenManageCategories && (
          <button
            type="button"
            id="manage-categories-filter-btn"
            onClick={() => {
              hapticButtonClick();
              onOpenManageCategories();
            }}
            title="Manage custom categories (create, rename, delete)"
            className="shrink-0 inline-flex items-center gap-1 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 px-2.5 py-1 text-xs font-medium text-zinc-500 hover:text-zinc-900 hover:border-zinc-400 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:border-zinc-500 transition-colors cursor-pointer"
          >
            <Settings2 className="h-3 w-3" />
            <span>Manage</span>
          </button>
        )}

        {/* Priority quick filter pills */}
        <div className="h-3 w-px bg-zinc-200 dark:bg-zinc-800 mx-1 shrink-0" />
        {(['high', 'medium', 'low'] as Priority[]).map((p) => {
          const isSelected = filterPriority === p;
          const config = PRIORITY_CONFIG[p];
          return (
            <button
              key={p}
              type="button"
              id={`filter-priority-${p}`}
              onClick={() => {
                hapticButtonClick();
                setFilterPriority(isSelected ? 'all' : p);
              }}
              className={`shrink-0 inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-medium transition-all active:scale-95 cursor-pointer ${
                isSelected
                  ? 'bg-zinc-900 text-white shadow-xs dark:bg-zinc-100 dark:text-zinc-900'
                  : 'text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800/60'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isSelected ? 'bg-current' : config.dotColor
                }`}
              />
              {config.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
