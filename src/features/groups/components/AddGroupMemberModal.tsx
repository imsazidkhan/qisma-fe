import { type ReactElement } from 'react';
import { Modal } from 'react-native';

import type { AddGroupMemberBody } from '@/features/groups/api/groupMembersApi';
import {
  AddGroupMembersPanel,
  type AddGroupMembersVariant,
} from '@/features/groups/components/AddGroupMembersPanel';

export type AddGroupMemberModalProps = {
  groupId: string;
  visible: boolean;
  onClose: () => void;
  onSubmit: (body: AddGroupMemberBody) => Promise<void>;
  isPending: boolean;
  initialUserId?: string;
};

export function AddGroupMemberModal({
  groupId,
  visible,
  onClose,
  onSubmit,
  isPending,
  initialUserId,
}: AddGroupMemberModalProps): ReactElement {
  const variant: AddGroupMembersVariant = 'modal';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <AddGroupMembersPanel
        groupId={groupId}
        active={visible}
        variant={variant}
        onDismiss={onClose}
        onSubmit={onSubmit}
        isPending={isPending}
        initialUserId={initialUserId}
      />
    </Modal>
  );
}
