import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useTemplateVal } from '@dsplay/react-template-utils';
import rssLogo from '../../assets/image/rss.png';
import logger from '../../utils/logger';
import './style.sass';

const KEY_VERSION = 'news_version';
const VERSION = '2.0';

const sizeMap = {
  20: 3,
  50: 2.5,
  75: 2.2,
  100: 1.8,
  120: 1.5,
  140: 1.3,
  200: 1.2,
};

function NewsContent({ url, logoBoxColor }) {
  const [count, setCount] = useState(0);
  const [result, setResult] = useState({});
  const [item, setItem] = useState({});
  const [error, setError] = useState();

  const storageKey = useMemo(() => `news-${url}`, [url]);

  useEffect(() => {
    const interval = setInterval(() => setCount((c) => c + 1), 1000 * 30);

    if (count % 10 === 0) {
      let news;
      const storedNews = localStorage.getItem(storageKey);
      const storedVersion = localStorage.getItem(KEY_VERSION);

      if (storedNews) {
        try {
          news = JSON.parse(storedNews);
        } catch (e) {
          localStorage.removeItem(storageKey);
          logger.error(`[news] error parsing stored value: ${storedNews}`);
        }
      }

      if (storedVersion !== VERSION || !news || (new Date().getTime() - news.timestamp > 1000 * 60 * 9)) {
        (async () => {
          try {
            logger.log('[news] fetching from the API');
            const response = await axios.get('https://api.dsplay.tv/rss/last-news', { params: { url } });
            const feed = response.data.data;

            setResult(feed);

            localStorage.setItem(storageKey, JSON.stringify({
              timestamp: new Date().getTime(),
              value: feed,
            }));
            localStorage.setItem(KEY_VERSION, VERSION.toString());
          } catch (e) {
            setError(e);
            localStorage.removeItem(storageKey);
            logger.error(`[news] error fetching feed: ${e}`);
          }
        })();
      } else {
        setResult(news.value);
      }
    }

    return () => clearInterval(interval);
  }, [count, storageKey, url]);

  useEffect(() => {
    if (result && result.items && result.items.length > 0) {
      setItem(result.items[Math.floor(Math.random() * result.items.length)]);
    }
  }, [count, result]);

  if (error) {
    return <div className="block news" />;
  }

  if (item && item.title) {
    let ratio = 1;

    const sizeKeys = Object.keys(sizeMap);
    for (let i = 0; i < sizeKeys.length; i += 1) {
      if (item.title.length <= +sizeKeys[i]) {
        ratio = sizeMap[sizeKeys[i]];
        break;
      }
    }

    const channelImageUrl = result.logo || rssLogo;

    return (
      <div className="block news">
        <div className="channel" style={{ backgroundImage: `url('${channelImageUrl}')`, backgroundColor: logoBoxColor }} />
        <div className="title" style={{ fontSize: `${ratio}em` }}>{item.title}</div>
      </div>
    );
  }

  return <div className="block news" />;
}

function News() {
  const url = useTemplateVal('rss_url');
  const logoBoxColor = useTemplateVal('rss_logo_box_color');

  if (!url) return null;

  return <NewsContent url={url} logoBoxColor={logoBoxColor} />;
}

export default News;
