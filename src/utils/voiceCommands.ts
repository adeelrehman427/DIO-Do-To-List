import { TodoItem } from '../types';

export interface VoiceSubtaskResult {
  isCommand: boolean;
  success: boolean;
  targetTodo?: TodoItem;
  subtaskTitle?: string;
  attemptedTaskName?: string;
  errorMessage?: string;
}

/**
 * Escapes regex special characters in a string
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Capitalizes the first letter of a string
 */
export function capitalizeFirst(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Parses spoken speech text to detect and process the command:
 * "add subtask to [task name] [subtask name]"
 *
 * Supports common variations like:
 * - "add subtask to [task name] [subtask name]"
 * - "add a subtask to [task name] [subtask name]"
 * - "add sub-task to [task name] [subtask name]"
 * - "add sub task to [task name] [subtask name]"
 * - "add subtask to [task name]: [subtask name]"
 * - "add subtask to [task name] called [subtask name]"
 * - "add subtask to [task name] named [subtask name]"
 * - "add subtask to [task name] to [subtask name]"
 */
export function parseVoiceSubtaskCommand(
  rawTranscript: string,
  existingTodos: TodoItem[]
): VoiceSubtaskResult {
  if (!rawTranscript || !rawTranscript.trim()) {
    return { isCommand: false, success: false };
  }

  // Remove trailing period or punctuation common in speech recognition results
  const transcript = rawTranscript
    .trim()
    .replace(/[.,!?;]+$/, '')
    .trim();

  // Pattern: "add (a/new)? sub( |-)?task(s)? to <remainder>"
  const commandRegex = /^\s*add\s+(?:a\s+|new\s+)?sub[- ]?tasks?\s+to\s+(.+)$/i;
  const match = transcript.match(commandRegex);

  if (!match) {
    return { isCommand: false, success: false };
  }

  const remainder = match[1].trim();
  if (!remainder) {
    return {
      isCommand: true,
      success: false,
      errorMessage: 'Please specify the task name and subtask name, e.g. "add subtask to [task name] [subtask name]".',
    };
  }

  // Clean remainder
  const cleanedRemainder = remainder.replace(/[.,!?;]+$/, '').trim();
  const remainderLower = cleanedRemainder.toLowerCase();

  // Sort todos by title length descending so longer matching titles take precedence
  const sortedTodos = [...existingTodos].sort((a, b) => b.title.length - a.title.length);

  // Strategy 1: Match against existing task titles at the beginning of the remainder
  for (const todo of sortedTodos) {
    const todoTitleTrimmed = todo.title.trim();
    if (!todoTitleTrimmed) continue;

    const todoTitleLower = todoTitleTrimmed.toLowerCase();

    // Check if remainder starts with this todo's title
    if (remainderLower.startsWith(todoTitleLower)) {
      let subtaskPart = cleanedRemainder.slice(todoTitleTrimmed.length).trim();

      // Strip leading separators like colons, dashes, or keywords "called", "named", "to"
      subtaskPart = subtaskPart.replace(/^[:\-\s]+/, '');
      subtaskPart = subtaskPart.replace(/^(?:called|named|to|saying|with\s+text)\s+/i, '');
      subtaskPart = subtaskPart.trim();

      if (subtaskPart.length > 0) {
        return {
          isCommand: true,
          success: true,
          targetTodo: todo,
          subtaskTitle: capitalizeFirst(subtaskPart),
        };
      }
    }
  }

  // Strategy 2: Check for explicit separators like "called", "named", ":", "-"
  const separatorMatch = cleanedRemainder.match(/^(.*?)(?:\s+(?:called|named|to)\s+|:\s*|\s+-\s+)(.+)$/i);
  if (separatorMatch) {
    const candidateTask = separatorMatch[1].trim().toLowerCase();
    const candidateSubtask = separatorMatch[2].trim();

    if (candidateTask && candidateSubtask) {
      // Find matching todo (exact or contains)
      const matched =
        existingTodos.find((t) => t.title.trim().toLowerCase() === candidateTask) ||
        existingTodos.find((t) => t.title.trim().toLowerCase().includes(candidateTask)) ||
        existingTodos.find((t) => candidateTask.includes(t.title.trim().toLowerCase()));

      if (matched) {
        return {
          isCommand: true,
          success: true,
          targetTodo: matched,
          subtaskTitle: capitalizeFirst(candidateSubtask),
        };
      }
    }
  }

  // Strategy 3: Word-sliding search across existing todos
  const words = cleanedRemainder.split(/\s+/);
  if (words.length >= 2) {
    for (let i = words.length - 1; i >= 1; i--) {
      const candidateTask = words.slice(0, i).join(' ').toLowerCase();
      let candidateSubtask = words.slice(i).join(' ').trim();

      candidateSubtask = candidateSubtask.replace(/^[:\-\s]+/, '');
      candidateSubtask = candidateSubtask.replace(/^(?:called|named|to)\s+/i, '');

      if (!candidateSubtask) continue;

      const matched =
        existingTodos.find((t) => t.title.trim().toLowerCase() === candidateTask) ||
        existingTodos.find((t) => t.title.trim().toLowerCase().includes(candidateTask) && candidateTask.length >= 3);

      if (matched) {
        return {
          isCommand: true,
          success: true,
          targetTodo: matched,
          subtaskTitle: capitalizeFirst(candidateSubtask),
        };
      }
    }
  }

  // Strategy 4: If it started with "add subtask to", but no matching task was found:
  // Estimate what the user meant as the task name to provide helpful feedback
  let attemptedTask = cleanedRemainder;
  let attemptedSubtask = '';

  if (words.length >= 2) {
    // If multiple words, guess the first 1-2 words as task and the rest as subtask
    const splitPoint = Math.min(2, Math.floor(words.length / 2));
    attemptedTask = words.slice(0, splitPoint).join(' ');
    attemptedSubtask = words.slice(splitPoint).join(' ');
  }

  return {
    isCommand: true,
    success: false,
    attemptedTaskName: attemptedTask,
    subtaskTitle: attemptedSubtask ? capitalizeFirst(attemptedSubtask) : undefined,
    errorMessage: `Task "${attemptedTask}" not found. Speak the name of an existing task to add subtasks to it.`,
  };
}
