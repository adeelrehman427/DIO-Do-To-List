import React from 'react';
import { CheckCircle, Search, ListTodo } from 'lucide-react';
import { FilterStatus, FilterPriority, FilterCategory } from '../types';

interface EmptyStateProps {
  totalCount: number;
  filterStatus: FilterStatus;
  filterPriority: FilterPriority;
  filterCategory?: FilterCategory;
  searchQuery: string;
  onResetFilters: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  totalCount,
  filterStatus,
  filterPriority,
  filterCategory = 'all',
  searchQuery,
  onResetFilters,
}) => {
  if (totalCount === 0) {
    return (
      <div className="py-16 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800/80">
          <ListTodo className="h-6 w-6 text-zinc-400 dark:text-zinc-500" />
        </div>
        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 font-display">
          All tasks cleared
        </h3>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto">
          You're all caught up! Use the input bar above to add your tasks with categories, priorities, and due dates.
        </p>
      </div>
    );
  }

  if (filterStatus === 'completed') {
    return (
      <div className="py-12 text-center">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800/80">
          <CheckCircle className="h-5 w-5 text-zinc-400 dark:text-zinc-500" />
        </div>
        <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
          No completed tasks yet
        </h3>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Completed items will appear here once you check them off.
        </p>
      </div>
    );
  }

  return (
    <div className="py-12 text-center">
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800/80">
        <Search className="h-5 w-5 text-zinc-400 dark:text-zinc-500" />
      </div>
      <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
        No tasks match the filter
      </h3>
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
        {searchQuery
          ? `No results for "${searchQuery}"`
          : 'Try changing your status, tag, or priority filters'}
      </p>
      {(filterStatus !== 'all' || filterPriority !== 'all' || filterCategory !== 'all' || searchQuery) && (
        <button
          type="button"
          id="reset-filters-btn"
          onClick={onResetFilters}
          className="mt-3 inline-flex items-center text-xs font-semibold text-zinc-900 hover:underline dark:text-zinc-100 cursor-pointer"
        >
          Reset all filters
        </button>
      )}
    </div>
  );
};
