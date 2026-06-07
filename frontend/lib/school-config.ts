// School-specific configuration for AMFOFANA ACADEMY
// Used for PDF branding, verification URLs, and school identity

export const SCHOOL_CONFIG = {
  name: 'AMFOFANA ACADEMY',
  subtitle: 'Excellence in Education',
  address: 'Conakry, Guinea',
  contact: 'accounts@amfofana.edu',
  verifyUrl: 'https://amfofana.edu/verify',
  logoPath: '/logo/fofanaa.png',          // from /public/logo/
  logoJpeg: false,                         // PNG format
  primaryColor: [15, 23, 42] as [number, number, number],   // dark navy
  accentColor: [37, 99, 235] as [number, number, number],   // blue-600
} as const;
