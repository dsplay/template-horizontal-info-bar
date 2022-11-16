import React, { useState, useEffect } from 'react';
import { tval } from '@dsplay/template-utils';

const key = tval('weatherbit_api_key');
const lat = tval('latitude');
const lon = tval('longitude');
const url = `https://api.dsplay.tv/weather/current?lat=${lat}&lon=${lon}`;
const storageKey = `tv.dsplay.info-bar.weather-(${lat},${lon})`;
const KEY_VERSION = 'weather_version';
const VERSION = '1.0';

function WeatherContent() {

  const [result, setResult] = useState();

  useEffect(() => {

    let weather = undefined;
    const storedWeather = localStorage.getItem(storageKey);
    const storedVersion = localStorage.getItem(KEY_VERSION);

    console.log('[weather] Getting weather');

    if (storedWeather) {
      try {
        weather = JSON.parse(storedWeather);
        console.log('[weather] loaded from localStorage');
      } catch (e) {
        localStorage.removeItem(storageKey);
        console.error('[weather] error parsing stored value: ' + storedWeather);
      }
    }

    if (storedVersion !== VERSION || !weather || (new Date().getTime() - weather.timestamp > 1000 * 60 * 60)) {
      (async () => {
        try {
          console.log('[weather] fetching from the API');
          const response = await fetch(url);
          const json = await response.json();

          console.log(response);
          if (!response.ok) {
            console.log(response.status, response.statusText, json);
            const { error } = json || {};
            throw new Error(`[weather] error fetching weather data: ${response.statusText}. ${error}`);
          }

          console.log('[weather] fetch complete');
          setResult(json);

          localStorage.setItem(storageKey, JSON.stringify({
            timestamp: new Date().getTime(),
            value: json,
          }));
          localStorage.setItem(KEY_VERSION, VERSION.toString());
        } catch (e) {
          console.error(e);
          localStorage.removeItem(storageKey);
        }
      })();
    } else {
      console.log('[weather] using from localStorage');
      setResult(weather.value);
    }

  }, []);

  console.log('[weather] result', result);

  if (result) {
    const {
      data: {
        weather: {
          current: {
            temp,
            icon,
          },
        },
      },
    } = result;

    return (
      <div className="block weather">
        <span className="temp">{Math.round(temp)}º</span>
        <img alt="" src={`https://www.weatherbit.io/static/img/icons/${icon}.png`} />
      </div>
    )
  }

  return null;

}

function Weather() {

  if (!key || !lat || !lon) {
    return null;
  }

  return <WeatherContent />;
}

export default Weather;