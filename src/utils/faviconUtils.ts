/**
 * Utility functions for managing favicon dynamically
 */

const DEFAULT_FAVICON = '/rabbit-favicon.svg';
const DEFAULT_LOGO_192 = '/logo192.png';
const DEFAULT_LOGO_512 = '/logo512.png';

/**
 * Sets the favicon dynamically based on the logo URL from API
 * @param logoUrl - The logo URL from the API, or null/undefined to use default
 */
export const setFavicon = (logoUrl: string | null | undefined) => {
  if (typeof document === 'undefined') return;

  const faviconUrl = logoUrl || DEFAULT_FAVICON;
  const logoUrlForPng = logoUrl || DEFAULT_LOGO_192;
  const logoUrlFor512 = logoUrl || DEFAULT_LOGO_512;

  // Get or create head element
  const head = document.head || document.getElementsByTagName('head')[0];

  // Remove existing favicon links
  const existingFavicons = head.querySelectorAll('link[rel*="icon"], link[rel*="shortcut"], link[rel*="apple-touch-icon"], link[rel*="mask-icon"]');
  existingFavicons.forEach((link) => link.remove());

  // Remove existing meta tags for favicon
  const existingMeta = head.querySelectorAll('meta[name*="msapplication-TileImage"], meta[property*="og:image"], meta[name*="twitter:image"]');
  existingMeta.forEach((meta) => meta.remove());

  // Determine file type from URL
  const isSvg = faviconUrl.toLowerCase().endsWith('.svg');
  const fileType = isSvg ? 'image/svg+xml' : 'image/png';

  // Create and add favicon links
  // Standard favicon
  const faviconLink = document.createElement('link');
  faviconLink.rel = 'icon';
  faviconLink.type = fileType;
  faviconLink.href = faviconUrl;
  head.appendChild(faviconLink);

  // Favicon with sizes
  const favicon32 = document.createElement('link');
  favicon32.rel = 'icon';
  favicon32.type = fileType;
  favicon32.href = faviconUrl;
  favicon32.setAttribute('sizes', '32x32');
  head.appendChild(favicon32);

  const favicon16 = document.createElement('link');
  favicon16.rel = 'icon';
  favicon16.type = fileType;
  favicon16.href = faviconUrl;
  favicon16.setAttribute('sizes', '16x16');
  head.appendChild(favicon16);

  // Shortcut icon
  const shortcutIcon = document.createElement('link');
  shortcutIcon.rel = 'shortcut icon';
  shortcutIcon.href = faviconUrl;
  head.appendChild(shortcutIcon);

  // Apple touch icons
  const appleTouchIcon = document.createElement('link');
  appleTouchIcon.rel = 'apple-touch-icon';
  appleTouchIcon.href = logoUrlForPng;
  head.appendChild(appleTouchIcon);

  const appleTouchIcon180 = document.createElement('link');
  appleTouchIcon180.rel = 'apple-touch-icon';
  appleTouchIcon180.href = logoUrlFor512;
  appleTouchIcon180.setAttribute('sizes', '180x180');
  head.appendChild(appleTouchIcon180);

  // Mask icon for Safari (only for SVG)
  if (isSvg) {
    const maskIcon = document.createElement('link');
    maskIcon.rel = 'mask-icon';
    maskIcon.href = faviconUrl;
    maskIcon.setAttribute('color', '#3C7795');
    head.appendChild(maskIcon);
  }

  // Update meta tags for Open Graph and Twitter
  const ogImage = document.createElement('meta');
  ogImage.setAttribute('property', 'og:image');
  ogImage.setAttribute('content', faviconUrl);
  head.appendChild(ogImage);

  const ogImageWidth = document.createElement('meta');
  ogImageWidth.setAttribute('property', 'og:image:width');
  ogImageWidth.setAttribute('content', '512');
  head.appendChild(ogImageWidth);

  const ogImageHeight = document.createElement('meta');
  ogImageHeight.setAttribute('property', 'og:image:height');
  ogImageHeight.setAttribute('content', '512');
  head.appendChild(ogImageHeight);

  const ogImageType = document.createElement('meta');
  ogImageType.setAttribute('property', 'og:image:type');
  ogImageType.setAttribute('content', fileType);
  head.appendChild(ogImageType);

  const twitterImage = document.createElement('meta');
  twitterImage.setAttribute('name', 'twitter:image');
  twitterImage.setAttribute('content', faviconUrl);
  head.appendChild(twitterImage);

  // Update msapplication-TileImage for Windows
  const msTileImage = document.createElement('meta');
  msTileImage.setAttribute('name', 'msapplication-TileImage');
  msTileImage.setAttribute('content', logoUrlForPng);
  head.appendChild(msTileImage);
};

/**
 * Resets favicon to default static icon
 */
export const resetFavicon = () => {
  setFavicon(null);
};

