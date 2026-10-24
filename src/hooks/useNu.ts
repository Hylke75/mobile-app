import { useEffect, useState } from 'react';

// De huidige tijd, elke minuut ververst
export function useNu(): Date {
  const [nu, setNu] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNu(new Date()), 60000);
    return () => clearInterval(t);
  }, []);
  return nu;
}
