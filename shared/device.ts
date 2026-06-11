/** Determines if the operating system is a mobile device (for opening links in apps). */
export const isMobileOperatingSystem = () => {
  if (typeof window === 'undefined') {
    return false;
  }
  return /Android|webOS|iPhone|iPad|iPod|Opera Mini/i.test(navigator.userAgent);
};

// These lines allow us to check for unknown properties on the window object.
interface UnknownBrowserWindow extends Window {
  [key: string]: unknown;
}
declare let window: UnknownBrowserWindow;

/**
 * Determine the mobile operating system.
 * This function returns one of 'iOS', 'Android', 'Windows Phone', or 'unknown'.
 *
 * @returns {String}
 */
export const getMobileOperatingSystem = () => {
  const userAgent = String(navigator.userAgent || navigator.vendor || window.opera);

  // Windows Phone must come first because its UA also contains "Android"
  if (/windows phone/i.test(userAgent)) {
    return 'Windows Phone';
  }

  if (/android/i.test(userAgent)) {
    return 'Android';
  }

  // iOS detection from: http://stackoverflow.com/a/9039885/177710
  if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
    return 'iOS';
  }

  return 'unknown';
};
