import { useState, useEffect, useMemo } from 'react';
import { useTemplateBoolVal, useConfig } from '@dsplay/react-template-utils';
import './style.sass';

function ClockContent() {
  const [now, setNow] = useState(new Date());
  const { locale = 'en_US' } = useConfig() || {};
  const [language] = locale.split('_');

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
  const showClock = useTemplateBoolVal('clock', true);

  if (!showClock) return null;

  return <ClockContent />;
}

export default Clock;
