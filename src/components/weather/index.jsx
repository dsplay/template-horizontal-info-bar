import { useState, useEffect } from 'react';
import axios from 'axios';
import moment from 'moment';
import { tval } from '@dsplay/template-utils';
import logger from '../../utils/logger';
import './style.sass';

const lat = tval('latitude');
const lon = tval('longitude');
const url = `https://api.dsplay.tv/weather/current?lat=${lat}&lon=${lon}`;
const storageKey = `tv.dsplay.info-bar.weather-(${lat},${lon})`;
const KEY_VERSION = 'weather_version';
const VERSION = '1.1';

function WeatherContent() {
  const [result, setResult] = useState();

  useEffect(() => {
    let weather;
    const storedWeather = localStorage.getItem(storageKey);
    const storedVersion = localStorage.getItem(KEY_VERSION);

    if (storedWeather) {
      try {
        weather = JSON.parse(storedWeather);
      } catch (e) {
        localStorage.removeItem(storageKey);
        logger.error(`[weather] error parsing stored value: ${storedWeather}`);
      }
    }

    if (storedVersion !== VERSION || !weather || (moment().utc().isAfter(moment.utc(weather.value?.expiresAt)))) {
      (async () => {
        try {
          logger.log('[weather] fetching from the API');
          const response = await axios.get(url);
          const json = response.data;

          setResult(json);

          localStorage.setItem(storageKey, JSON.stringify({
            value: json,
          }));
          localStorage.setItem(KEY_VERSION, VERSION.toString());
        } catch (e) {
          localStorage.removeItem(storageKey);
          logger.error(`[weather] error fetching weather data: ${e}`);
        }
      })();
    } else {
      logger.log('[weather] using value from localStorage');
      setResult(weather.value);
    }
  }, []);

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
    );
  }

  return null;
}

function Weather() {
  if (!lat || !lon) {
    return null;
  }

  return <WeatherContent />;
}

export default Weather;
