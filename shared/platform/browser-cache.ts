const setBrowserCache = (key: string, value: string, expirationInMinutes: number) => {
  if (typeof window === 'undefined') {
    return;
  }

  const now = new Date();
  const item: { value: string, expiration: number } = {
    value,
    expiration: now.getTime() + expirationInMinutes * 60000,
  };
  sessionStorage.setItem(key, JSON.stringify(item));
};

const getBrowserCache = (key: string) => {
  if (typeof window === 'undefined') {
    return null;
  }

  const itemString = sessionStorage.getItem(key);
  // If the item doesn't exist, return null
  if (!itemString) {
    return null;
  }
  const item = JSON.parse(itemString);
  const now = new Date();
  // Compare the current time with the expiration time
  if (now.getTime() > item.expiration) {
    // If the item has expired, remove it from storage and return null
    sessionStorage.removeItem(key);
    return null;
  }
  return item.value;
};

const deleteBrowserCache = (key: string) => {
  if (typeof window === 'undefined') {
    return;
  }

  sessionStorage.removeItem(key);
};

const BrowserCache = {
  set: setBrowserCache,
  get: getBrowserCache,
  delete: deleteBrowserCache,
};

export default BrowserCache;
