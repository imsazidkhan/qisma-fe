/**
 * Veloraq expense comments API — thin façade over {@link '@/features/expenses/api/expenseCommentsApi'}.
 *
 * Base path: `/v1/groups/:groupId/expenses/:expenseId/comments`
 */
export {
  createExpenseComment,
  deleteExpenseComment,
  listExpenseComments,
  patchExpenseComment,
} from '@/features/expenses/api/expenseCommentsApi';
export type { ListExpenseCommentsParams } from '@/features/expenses/api/expenseCommentsApi';
