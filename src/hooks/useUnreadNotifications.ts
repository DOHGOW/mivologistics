import { useEffect, useState } from 'react';
import { watchNotifications } from '../lib/firestore';
import { isDemoMode } from '../firebase';

export function useUnreadNotifications(uid: string | undefined): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (isDemoMode || !uid) return;
    const unsub = watchNotifications(uid, (items) => setCount(items.filter((n) => !n.read).length));
    return () => unsub();
  }, [uid]);

  return count;
}
