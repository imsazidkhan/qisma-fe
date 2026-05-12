import { Platform, Share } from 'react-native';

import { logger } from '@/services/logger';

/**
 * Opens the OS share sheet (Messages, Mail, copy, etc.). Swallows user-dismiss;
 * logs unexpected failures only (no PII in `message`).
 */
export async function shareTextNative(message: string, dialogTitle?: string): Promise<void> {
  try {
    await Share.share(
      Platform.OS === 'ios' ? { message } : { message, title: dialogTitle ?? undefined },
    );
  } catch (e) {
    logger.captureException(e, { tags: { flow: 'native_share' } });
  }
}
