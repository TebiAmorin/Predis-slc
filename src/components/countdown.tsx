"use client";

import { useState, useEffect } from "react";

export function Countdown({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    function update() {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    }
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  if (!mounted) return null;

  const total = timeLeft.days + timeLeft.hours + timeLeft.minutes + timeLeft.seconds;
  if (total === 0) return null;

  const units = [
    { value: timeLeft.days, label: "DÍAS" },
    { value: timeLeft.hours, label: "HRS" },
    { value: timeLeft.minutes, label: "MIN" },
    { value: timeLeft.seconds, label: "SEG" },
  ];

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      {units.map((u, i) => (
        <div key={u.label} className="flex items-center gap-2 sm:gap-3">
          <div className="flex flex-col items-center">
            <span className="font-heading font-black text-xl sm:text-2xl text-text tabular-nums leading-none">
              {String(u.value).padStart(2, "0")}
            </span>
            <span className="text-[8px] sm:text-[9px] text-text-secondary tracking-widest font-bold mt-1">
              {u.label}
            </span>
          </div>
          {i < units.length - 1 && (
            <span className="text-accent font-black text-lg opacity-40 -mt-3">:</span>
          )}
        </div>
      ))}
    </div>
  );
}
