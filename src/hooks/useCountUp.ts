import { useEffect, useRef, useState } from "react";

export function useCountUp(target: number, duration = 900): number {
  const [val, setVal] = useState(0);
  const startTs = useRef<number | null>(null);
  const fromRef = useRef(0);

  useEffect(() => {
    fromRef.current = val;
    startTs.current = null;
    let raf = 0;
    const tick = (ts: number) => {
      if (startTs.current == null) startTs.current = ts;
      const elapsed = ts - startTs.current;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setVal(fromRef.current + (target - fromRef.current) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration]);

  return val;
}
