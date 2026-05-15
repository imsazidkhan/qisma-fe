import type { ReactElement } from 'react';

import { ContactSyncScreen } from '@/features/contacts/components/ContactSyncScreen';

/** `GET`-style UX only; sync is `POST /v1/contacts/sync` from {@link ContactSyncScreen}. */
export default function HomeContactsSyncRoute(): ReactElement {
  return <ContactSyncScreen />;
}
