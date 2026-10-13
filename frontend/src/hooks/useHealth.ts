import { useEffect, useState } from 'react';
import { getHealth } from '@/api/health';

export function useHealth() {
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');

  useEffect(() => {
    getHealth()
      .then(() => setStatus('ok'))
      .catch(() => setStatus('error'));
  }, []);

  return status;
}
