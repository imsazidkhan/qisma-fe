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

export function useUploadExpenseReceipt(groupId: string, expenseId: string) {
  const queryClient = useQueryClient();
  const gid = groupId.trim();
  const eid = expenseId.trim();

  return useMutation<ExpenseAttachmentEntry, Error, UploadExpenseReceiptVariables>({
    mutationFn: ({ file, onProgress }) =>
      uploadExpenseReceiptWithProgress(gid, eid, file, { onProgress }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: expensesQueryKeys.detail(gid, eid) });
    },
  });
}
