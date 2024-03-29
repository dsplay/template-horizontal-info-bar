import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { tval, config } from '@dsplay/template-utils';

const { locale } = config;
const KEY_VERSION = 'currency_version';
const VERSION = '1.4';

const formatMoney = function (n, c, d, t) {
  var c = isNaN(c = Math.abs(c)) ? 2 : c,
    d = d === undefined ? "." : d,
    t = t === undefined ? "," : t,
    s = n < 0 ? "-" : "",
    i = String(parseInt(n = Math.abs(Number(n) || 0).toFixed(c))),
    j = (j = i.length) > 3 ? j % 3 : 0;
  return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
};

function getNumberSeparator(locale) {

  const separators = {
    pt_br: [',', '.'],
  };

  if (separators[locale]) {
    return separators[locale];
  }

  return ['.', ','];
}

const separators = getNumberSeparator(locale);

const from1 = tval('source_currency_1');
const from2 = tval('source_currency_2');
const targetCurrency = tval('target_currency');

const pair1 = `${from1}_${targetCurrency}`;
const pair2 = `${from2}_${targetCurrency}`;
const storageKey = `quotes_${pair1}_${pair2}`;

async function fetchAndConvertFreeCurrencyApi() {
  // https://github.com/fawazahmed0/currency-api
  const pair1 = `${from1}_${targetCurrency}`.toUpperCase();
  const pair2 = `${from2}_${targetCurrency}`.toUpperCase();
  // const
  let value;
  await (async () => {
    let url = `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${targetCurrency.toLowerCase()}.json`;
    let res = await axios(url);
    value = res.data;
  })();

  return {
    [pair1]: 1 / value[targetCurrency.toLowerCase()][from1.toLowerCase()],
    [pair2]: 1 / value[targetCurrency.toLowerCase()][from2.toLowerCase()],
  };
}


function QuotesContent() {
  const [result, setResult] = useState({});
  const [error, setError] = useState();

  const [counter, setCounter] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setCounter(counter + 1), 1000 * 60 * 60);
    return () => clearInterval(interval);
  }, [counter]);

  useEffect(() => {
    let quotes = undefined;
    const storedQuotes = localStorage.getItem(storageKey);
    const storedVersion = localStorage.getItem(KEY_VERSION);

    console.log('[quotes] Getting quotes');
    console.log('[quotes] stored value: ' + storedQuotes);
    console.log('[quotes] stored version: ' + storedVersion);

    if (storedQuotes) {
      try {
        quotes = JSON.parse(storedQuotes);
        console.log('[quotes] loaded from localStorage: ', quotes);
      } catch (e) {
        localStorage.removeItem(storageKey);
        console.error('[quotes] Error parsing stored value: ', storedQuotes);
      }
    }

    if (storedVersion !== VERSION || !quotes || (new Date().getTime() - quotes.timestamp > 1000 * 60 * 50)) {
      (async () => {
        try {
          // try the free API
          console.log('[quotes] fetching from the API');
          let value = await fetchAndConvertFreeCurrencyApi();

          console.log('[quotes] fetched successfully', value);
          setResult(value);
          localStorage.setItem(storageKey, JSON.stringify({
            timestamp: new Date().getTime(),
            value,
          }));
          localStorage.setItem(KEY_VERSION, VERSION.toString());
        } catch (e) {
          console.error('[quotes] error fetching from the API', e);
          setError(e);
          localStorage.removeItem(storageKey);
        }
      })();
    } else {
      setResult(quotes.value);
    }
  }, [counter]);

  console.log(`[quotes] error: ${error}`);
  console.log(`[quotes] result: ${JSON.stringify(result)}`);

  if (error || !result[pair1]) {
    return null;
  }

  const currencyValueBoxStyle = {
    backgroundColor: tval('currency_box_color', 'black'),
    color: tval('currency_text_color', 'white'),
  };

  console.log("[quotes] Hello");

  return (
    <div className="block quotes">
      <div className="block vertsical">
        <div className="id">{from1}</div>
        <div className="value" style={currencyValueBoxStyle}>{formatMoney(result[pair1], 2, separators[0], separators[1])}</div>
      </div>
      <div className="block vertsical">
        <div className="id">{from2}</div>
        <div className="value" style={currencyValueBoxStyle}>{formatMoney(result[pair2], 2, separators[0], separators[1])}</div>
      </div>
    </div>
  );
}


function Quotes() {
  return <QuotesContent />;
}

export default Quotes;