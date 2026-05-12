import { useMutation, useQueryClient } from '@tanstack/react-query';

import { uploadExpenseReceiptWithProgress } from '@/features/expenses/api/expenseReceiptsApi';
import { expensesQueryKeys } from '@/features/expenses/queryKeys';
import type {
  ExpenseAttachmentEntry,
  UploadExpenseReceiptFile,
} from '@/features/expenses/types/expenseAttachment.types';

export type UploadExpenseReceiptVariables = {
  file: UploadExpenseReceiptFile;
  onProgress?: (ratio: number) => void;
};

export function useUploadExpenseReceipt(expenseId: string) {
  const queryClient = useQueryClient();

  return useMutation<ExpenseAttachmentEntry, Error, UploadExpenseReceiptVariables>({
    mutationFn: ({ file, onProgress }) =>
      uploadExpenseReceiptWithProgress(expenseId, file, { onProgress }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: expensesQueryKeys.detail(expenseId) });
    },
  });
}
