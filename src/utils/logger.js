const logger = {
  log: (message) => {
    if (import.meta.env.MODE !== 'production') {
      // eslint-disable-next-line no-console
      console.log(`[LOG] ${new Date().toISOString()}: ${message}`);
    }
  },
  error: (message) => {
    if (import.meta.env.MODE !== 'production') {
      console.error(`[ERROR] ${new Date().toISOString()}: ${message}`);
    }
  },
  warn: (message) => {
    if (import.meta.env.MODE !== 'production') {
      console.warn(`[WARN] ${new Date().toISOString()}: ${message}`);
    }
  },
};

export default logger;
