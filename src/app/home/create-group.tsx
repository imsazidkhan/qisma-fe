import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useCallback, type ReactElement } from 'react';

import { ENDPOINTS } from '@/api';
import { hrefGroupDetail } from '@/constants/routes';
import { CreateGroupScreen, createGroup, type GroupTypeId } from '@/features/groups';
import { groupsQueryKeys } from '@/features/groups/queryKeys';
import { logger } from '@/services/logger';

/**
 * Full-screen create-group flow nested under **`/home`** (above the tab shell).
 */
export default function CreateGroupRoute(): ReactElement {
  const queryClient = useQueryClient();

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/home');
  }, []);

  const handleSubmit = useCallback(
    async (payload: { name: string; type: GroupTypeId; iconEmoji: string }) => {
      logger.breadcrumb('create_group_submit', {
        tags: {
          nameLength: payload.name.length,
          type: payload.type,
          hasIcon: payload.iconEmoji.length > 0,
        },
      });
      try {
        const group = await createGroup({ name: payload.name, type: payload.type });
        queryClient.setQueryData(groupsQueryKeys.memberProfile(group.id), group);
        await queryClient.invalidateQueries({ queryKey: groupsQueryKeys.myGroups });
        router.replace(hrefGroupDetail(group.id));
      } catch (e) {
        logger.captureException(e, {
          endpoint: ENDPOINTS.groups.create,
          tags: { flow: 'create_group' },
        });
        throw e;
      }
    },
    [queryClient],
  );

  return <CreateGroupScreen onBack={handleBack} onSubmit={handleSubmit} />;
}
