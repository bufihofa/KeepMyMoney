import { useEffect, useState } from 'react';
import { ensureAppBootstrapped } from '../db/database';

export function useBootstrap() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        await ensureAppBootstrapped();
        setReady(true);
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : 'Unable to initialize local storage');
      }
    })();
  }, []);

  return { ready, error };
}
