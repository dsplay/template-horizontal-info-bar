import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useTemplateVal, useConfig } from '@dsplay/react-template-utils';
import logger from '../../utils/logger';
import './style.sass';

const KEY_VERSION = 'currency_version';
const VERSION = '1.4';

function formatMoney(n, c, d, t) {
  const cc = Number.isNaN(c = Math.abs(c)) ? 2 : c;
  const dd = d === undefined ? '.' : d;
  const tt = t === undefined ? ',' : t;
  const s = n < 0 ? '-' : '';
  const i = String(Number.parseInt(n = Math.abs(Number(n) || 0).toFixed(cc), 10));
  const j = (i.length > 3) ? i.length % 3 : 0;
  return s + (j ? i.slice(0, j) + tt : '') + i.slice(j).replace(/(\d{3})(?=\d)/g, `$1${tt}`) + (cc ? dd + Math.abs(n - i).toFixed(cc).slice(2) : '');
}

function getNumberSeparator(loc) {
  const separators = {
    pt_br: [',', '.'],
  };

  if (separators[loc]) {
    return separators[loc];
  }

  return ['.', ','];
}

async function fetchAndConvertFreeCurrencyApi(from1, from2, targetCurrency) {
  // https://github.com/fawazahmed0/currency-api
  const upperPair1 = `${from1}_${targetCurrency}`.toUpperCase();
  const upperPair2 = `${from2}_${targetCurrency}`.toUpperCase();
  const url = `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${targetCurrency.toLowerCase()}.json`;
  const res = await axios(url);
  const value = res.data;

  return {
    [upperPair1]: 1 / value[targetCurrency.toLowerCase()][from1.toLowerCase()],
    [upperPair2]: 1 / value[targetCurrency.toLowerCase()][from2.toLowerCase()],
  };
}

function QuotesContent({ from1, from2, targetCurrency }) {
  const { locale } = useConfig();
  const currencyBoxColor = useTemplateVal('currency_box_color', 'black');
  const currencyTextColor = useTemplateVal('currency_text_color', 'white');

  const separators = useMemo(() => getNumberSeparator(locale), [locale]);
  const pair1 = useMemo(() => `${from1}_${targetCurrency}`, [from1, targetCurrency]);
  const pair2 = useMemo(() => `${from2}_${targetCurrency}`, [from2, targetCurrency]);
  const storageKey = useMemo(() => `quotes_${pair1}_${pair2}`, [pair1, pair2]);

  const [result, setResult] = useState({});
  const [error, setError] = useState();

  const [counter, setCounter] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setCounter((c) => c + 1), 1000 * 60 * 60);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let quotes;
    const storedQuotes = localStorage.getItem(storageKey);
    const storedVersion = localStorage.getItem(KEY_VERSION);

    if (storedQuotes) {
      try {
        quotes = JSON.parse(storedQuotes);
      } catch (e) {
        localStorage.removeItem(storageKey);
        logger.error(`[quotes] error parsing stored value: ${storedQuotes}`);
      }
    }

    if (storedVersion !== VERSION || !quotes || (new Date().getTime() - quotes.timestamp > 1000 * 60 * 50)) {
      (async () => {
        try {
          logger.log('[quotes] fetching from the API');
          const value = await fetchAndConvertFreeCurrencyApi(from1, from2, targetCurrency);

          setResult(value);
          localStorage.setItem(storageKey, JSON.stringify({
            timestamp: new Date().getTime(),
            value,
          }));
          localStorage.setItem(KEY_VERSION, VERSION.toString());
        } catch (e) {
          setError(e);
          localStorage.removeItem(storageKey);
          logger.error(`[quotes] error fetching from the API: ${e}`);
        }
      })();
    } else {
      logger.log('[quotes] using value from localStorage');
      setResult(quotes.value);
    }
  }, [counter, storageKey, from1, from2, targetCurrency]);

  if (error || !result[pair1]) {
    return null;
  }

  const currencyValueBoxStyle = {
    backgroundColor: currencyBoxColor,
    color: currencyTextColor,
  };

  return (
    <div className="block quotes">
      <div className="block vertical">
        <div className="id">{from1}</div>
        <div className="value" style={currencyValueBoxStyle}>{formatMoney(result[pair1], 2, separators[0], separators[1])}</div>
      </div>
      <div className="block vertical">
        <div className="id">{from2}</div>
        <div className="value" style={currencyValueBoxStyle}>{formatMoney(result[pair2], 2, separators[0], separators[1])}</div>
      </div>
    </div>
  );
}

function Quotes() {
  const from1 = useTemplateVal('source_currency_1');
  const from2 = useTemplateVal('source_currency_2');
  const targetCurrency = useTemplateVal('target_currency');

  return <QuotesContent from1={from1} from2={from2} targetCurrency={targetCurrency} />;
}

export default Quotes;
