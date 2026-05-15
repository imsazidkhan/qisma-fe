import type { ReactElement } from 'react';

import {
  ExpenseCard,
  type ExpenseCardProps,
} from '@/features/expenses/components/feedCard/ExpenseCard';

export type GroupExpenseFeedRowProps = ExpenseCardProps;

/** Premium compact ledger row for group expense feeds. */
export function GroupExpenseFeedRow(props: GroupExpenseFeedRowProps): ReactElement {
  return <ExpenseCard {...props} />;
}
