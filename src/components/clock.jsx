import React, { useState, useEffect, useMemo } from 'react';
import { tbval, config } from '@dsplay/template-utils';

const showClock = tbval('clock', true);
const { locale = 'en_US' } = config || {};
const [language] = locale.split('_');

function ClockContent() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, [now]);

  const dateText = useMemo(() => now.toLocaleString(language, {
    day: '2-digit',
    month: '2-digit',
  }), [language, now]);

  const timeText = useMemo(() => now.toLocaleString(language, {
    hour: '2-digit',
    minute: '2-digit',
  }), [language, now]);

  return (
    <div className="block clock">
      <div className="time">
        {dateText.replace('/', '-')} | {timeText}
      </div>
    </div>
  );
}

function Clock() {

  if (!showClock) return null;

  return <ClockContent />;
}

export default Clock;