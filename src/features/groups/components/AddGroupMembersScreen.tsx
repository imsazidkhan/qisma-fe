import { useCallback, useEffect, useRef, type ReactElement } from 'react';

import type { AddGroupMemberBody } from '@/features/groups/api/groupMembersApi';
import {
  AddGroupMembersPanel,
  type AddGroupMembersVariant,
} from '@/features/groups/components/AddGroupMembersPanel';
import { useAddGroupMember } from '@/features/groups/hooks/useGroupMembers';

export type AddGroupMembersScreenProps = {
  groupId: string;
  onBack: () => void;
};

/**
 * Full-screen add members flow: suggested phone contacts from the device and manual phone invite.
 */
export function AddGroupMembersScreen({
  groupId,
  onBack,
}: AddGroupMembersScreenProps): ReactElement {
  const variant: AddGroupMembersVariant = 'screen';
  const addMutation = useAddGroupMember(groupId);
  const resetRef = useRef(addMutation.reset);
  resetRef.current = addMutation.reset;
  const mutateAsyncRef = useRef(addMutation.mutateAsync);
  mutateAsyncRef.current = addMutation.mutateAsync;

  useEffect(() => {
    return () => {
      resetRef.current();
    };
  }, []);

  const onSubmit = useCallback(async (body: AddGroupMemberBody) => {
    await mutateAsyncRef.current(body);
  }, []);

  return (
    <AddGroupMembersPanel
      groupId={groupId}
      active
      variant={variant}
      onDismiss={onBack}
      onSubmit={onSubmit}
      isPending={addMutation.isPending}
    />
  );
}
