import type { CSSProperties } from 'react';

interface IconGlyphProps {
  name: string;
  className?: string;
  style?: CSSProperties;
  size?: 'sm' | 'md' | 'lg';
}

function stroke(name: string) {
  switch (name) {
    case 'home':
      return <path d="M3 11.5 12 4l9 7.5M7 10v9h10v-9" />;
    case 'list':
      return <path d="M9 6h10M9 12h10M9 18h10M4 6h.01M4 12h.01M4 18h.01" />;
    case 'plus':
      return <path d="M12 5v14M5 12h14" />;
    case 'budget':
      return <path d="M5 5h14v4H5zM5 11h8v8H5zM16 13l3 3-3 3" />;
    case 'chart':
      return <path d="M5 18V8M12 18V5M19 18v-7M4 19h16" />;
    case 'settings':
      return <path d="M12 8.8a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4Zm7 3.2-.9-.3a6.9 6.9 0 0 0-.5-1.2l.4-.9-1.7-1.7-.9.4c-.4-.2-.8-.4-1.2-.5L14 5h-4l-.3.9c-.4.1-.8.3-1.2.5l-.9-.4-1.7 1.7.4.9c-.2.4-.4.8-.5 1.2L5 12l.9.3c.1.4.3.8.5 1.2l-.4.9 1.7 1.7.9-.4c.4.2.8.4 1.2.5l.3.9h4l.3-.9c.4-.1.8-.3 1.2-.5l.9.4 1.7-1.7-.4-.9c.2-.4.4-.8.5-1.2l.9-.3Z" />;
    case 'wallet':
      return <path d="M4 8a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v2H4zm0 2h16v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zm11 3h3" />;
    case 'bank':
      return <path d="M4 9 12 5l8 4M6 10v7M10 10v7M14 10v7M18 10v7M4 19h16" />;
    case 'cash':
      return <path d="M4 7h16v10H4zM8 12h8M9 10a3 3 0 1 0 0 4" />;
    case 'piggy':
      return <path d="M5 13a5 5 0 0 1 5-5h4a4 4 0 0 1 4 4v2l1 1v1h-2l-1 2h-2l-.5-1.5h-3L9 18H7l.5-2H6a1 1 0 0 1-1-1v-2Zm9-2h.01" />;
    case 'bag':
      return <path d="M6 8h12l-1 11H7L6 8Zm3 0V6a3 3 0 1 1 6 0v2" />;
    case 'food':
      return <path d="M8 4v7M6 4v7M10 4v7M7 11v9M15 4v9a2 2 0 0 0 2 2h1" />;
    case 'transport':
      return <path d="M6 16h12l-1-7H7Zm2 3a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm8 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z" />;
    case 'house':
      return <path d="M4 11 12 4l8 7v9h-5v-5H9v5H4z" />;
    case 'bill':
      return <path d="M7 4h10v16l-2-1-2 1-2-1-2 1-2-1zM9 9h6M9 13h6" />;
    case 'heart':
      return <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.4A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" />;
    case 'shopping':
      return <path d="M6 7h12l-1.2 12H7.2L6 7Zm3 0V5a3 3 0 1 1 6 0v2" />;
    case 'spark':
      return <path d="m12 4 1.7 4.3L18 10l-4.3 1.7L12 16l-1.7-4.3L6 10l4.3-1.7Z" />;
    case 'gift':
      return <path d="M4 8h16v4H4zM6 12h12v8H6zM12 8v12M10 8s-3-1-3-3a2 2 0 0 1 3 0l2 3m0 0 2-3a2 2 0 0 1 3 0c0 2-3 3-3 3" />;
    case 'salary':
      return <path d="M4 7h16v10H4zM10 10h4M12 8v8" />;
    case 'bonus':
      return <path d="M12 3v4M12 17v4M4.2 6.2l2.8 2.8M17 15l2.8 2.8M3 12h4M17 12h4M4.2 17.8 7 15M17 9l2.8-2.8M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" />;
    case 'import':
      return <path d="M12 4v10M8 10l4 4 4-4M5 18h14" />;
    case 'export':
      return <path d="M12 20V10M8 14l4-4 4 4M5 6h14" />;
    case 'copy':
      return <path d="M9 9V5h10v10h-4M5 9H15V19H5z" />;
    case 'trash':
      return <path d="M5 7h14M9 7V5h6v2M8 10v7M12 10v7M16 10v7M7 7l1 13h8l1-13" />;
    case 'edit':
      return <path d="m4 20 4.5-1 9-9a2.1 2.1 0 0 0-3-3l-9 9Z" />;
    case 'search':
      return <path d="M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14Zm9 3-4.3-4.3" />;
    case 'filter':
      return <path d="M4 6h16M7 12h10M10 18h4" />;
    case 'close':
      return <path d="M6 6l12 12M18 6 6 18" />;
    case 'moon':
      return <path d="M18 14.5A6.5 6.5 0 0 1 9.5 6 7 7 0 1 0 18 14.5Z" />;
    case 'sun':
      return <path d="M12 4v2M12 18v2M4 12h2M18 12h2M6.3 6.3l1.4 1.4M16.3 16.3l1.4 1.4M6.3 17.7l1.4-1.4M16.3 7.7l1.4-1.4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" />;
    case 'tag':
      return <path d="M20 12 12 20 4 12V5h7z" />;
    case 'transfer':
      return <path d="M7 7h10M13 3l4 4-4 4M17 17H7M11 21l-4-4 4-4" />;
    // New icons for v2
    case 'chevronDown':
      return <path d="M6 9l6 6 6-6" />;
    case 'chevronRight':
      return <path d="M9 6l6 6-6 6" />;
    case 'check':
      return <path d="M5 12l5 5L20 7" />;
    case 'info':
      return <><circle cx="12" cy="12" r="9" /><path d="M12 16v-4M12 8h.01" /></>;
    case 'warning':
      return <><path d="M12 3 2 21h20L12 3z" /><path d="M12 14v-4M12 17h.01" /></>;
    case 'calendar':
      return <path d="M4 8V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2M4 8h16M4 8v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8M8 4v2M16 4v2M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01" />;
    case 'clock':
      return <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></>;
    case 'arrowUp':
      return <path d="M12 19V5M5 12l7-7 7 7" />;
    case 'arrowDown':
      return <path d="M12 5v14M5 12l7 7 7-7" />;
    case 'drag':
      return <path d="M8 6h.01M8 10h.01M8 14h.01M8 18h.01M16 6h.01M16 10h.01M16 14h.01M16 18h.01" />;
    case 'shield':
      return <path d="M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6l7-3z" />;
    case 'trendUp':
      return <path d="M4 18l5-5 3 3 8-8M16 8h4v4" />;
    case 'trendDown':
      return <path d="M4 6l5 5 3-3 8 8M16 16h4v-4" />;
    case 'percent':
      return <><circle cx="8" cy="8" r="2" /><circle cx="16" cy="16" r="2" /><path d="M19 5 5 19" /></>;
    default:
      return <path d="M12 5v14M5 12h14" />;
  }
}

const sizeMap = { sm: '0.9rem', md: '1.15rem', lg: '1.5rem' } as const;

export function IconGlyph({ name, className, style, size = 'md' }: IconGlyphProps) {
  const dimension = sizeMap[size];
  return (
    <svg
      className={className}
      style={{ width: dimension, height: dimension, ...style }}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {stroke(name)}
    </svg>
  );
}
