import { GeistMono, GeistSans } from 'geist/font';
import { IBM_Plex_Serif, Inter } from 'next/font/google';

// Export Geist fonts (self-hosted)
export const geistSans = GeistSans;
export const geistMono = GeistMono;

// Load Google fonts - these are loaded at build time regardless of configuration
// We don't import config here to avoid circular dependencies
export const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  weight: ['400', '500', '600', '700'],
  preload: true,
});

// Load IBM Plex Serif font with improved config
export const ibmPlexSerif = IBM_Plex_Serif({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-ibm-plex-serif',
  weight: ['400', '500', '600', '700'],
  preload: true,
  fallback: ['Georgia', 'Times New Roman', 'serif'],
});

// Helper function to get the appropriate font class based on config
export function getFontClass(fontFamily = 'geist') {
  try {
    switch (fontFamily) {
      case 'inter':
        return inter.variable;
      case 'ibm-plex-serif':
        return ibmPlexSerif.variable;
      default:
        return geistSans.variable;
    }
  } catch {
    // Fallback to Geist Sans if config is not available
    return geistSans.variable;
  }
}

// Helper function to get appropriate CSS class for body
export function getBodyClass(fontFamily = 'geist') {
  try {
    if (fontFamily === 'ibm-plex-serif') {
      return 'font-serif';
    }
    return '';
  } catch {
    return '';
  }
}

// Export all configured fonts together
export const fonts = {
  inter,
  ibmPlexSerif,
  geistSans,
  geistMono,
  getFontClass,
  getBodyClass,
};

export default fonts;
