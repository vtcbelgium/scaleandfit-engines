// src/photo/specs.ts
export interface BiometricPhotoSpec {
  slug: string;
  country: string;
  documentType: string;
  widthMm: number;
  heightMm: number;
  minHeadMm: number;
  maxHeadMm: number;
  eyeLineFromBottomMinRatio: number;
  eyeLineFromBottomMaxRatio: number;
  backgroundHex: string;
  maxFileSizeKb?: number;
  notes: string;
}

export const BIOMETRIC_PHOTO_SPECS: BiometricPhotoSpec[] = [
  { slug: 'us-passport-2x2', country: 'United States', documentType: 'Passport', widthMm: 50.8, heightMm: 50.8, minHeadMm: 25, maxHeadMm: 35, eyeLineFromBottomMinRatio: 0.56, eyeLineFromBottomMaxRatio: 0.69, backgroundHex: '#FFFFFF', notes: '' },
  { slug: 'us-visa-ds160', country: 'United States', documentType: 'DS-160 Visa', widthMm: 50.8, heightMm: 50.8, minHeadMm: 25, maxHeadMm: 35, eyeLineFromBottomMinRatio: 0.56, eyeLineFromBottomMaxRatio: 0.69, backgroundHex: '#FFFFFF', maxFileSizeKb: 240, notes: '' },
  { slug: 'schengen-visa-35x45', country: 'Schengen Area', documentType: 'Visa', widthMm: 35, heightMm: 45, minHeadMm: 32, maxHeadMm: 36, eyeLineFromBottomMinRatio: 0.55, eyeLineFromBottomMaxRatio: 0.68, backgroundHex: '#F4F4F4', notes: '' },
  { slug: 'belgium-passport-eid', country: 'Belgium', documentType: 'Passport & eID', widthMm: 35, heightMm: 45, minHeadMm: 31, maxHeadMm: 36, eyeLineFromBottomMinRatio: 0.55, eyeLineFromBottomMaxRatio: 0.68, backgroundHex: '#FFFFFF', notes: '' },
  { slug: 'netherlands-pasfoto', country: 'Netherlands', documentType: 'Pasfoto Passport/ID', widthMm: 35, heightMm: 45, minHeadMm: 26, maxHeadMm: 30, eyeLineFromBottomMinRatio: 0.54, eyeLineFromBottomMaxRatio: 0.67, backgroundHex: '#F2F2F2', notes: '' },
  { slug: 'germany-biometric-passport', country: 'Germany', documentType: 'Reisepass', widthMm: 35, heightMm: 45, minHeadMm: 32, maxHeadMm: 36, eyeLineFromBottomMinRatio: 0.56, eyeLineFromBottomMaxRatio: 0.68, backgroundHex: '#F2F2F2', notes: '' },
  { slug: 'france-passport-cni', country: 'France', documentType: 'Passeport & CNI', widthMm: 35, heightMm: 45, minHeadMm: 32, maxHeadMm: 36, eyeLineFromBottomMinRatio: 0.55, eyeLineFromBottomMaxRatio: 0.68, backgroundHex: '#E8EEF5', notes: '' },
  { slug: 'uk-passport-35x45', country: 'United Kingdom', documentType: 'Passport', widthMm: 35, heightMm: 45, minHeadMm: 29, maxHeadMm: 34, eyeLineFromBottomMinRatio: 0.55, eyeLineFromBottomMaxRatio: 0.68, backgroundHex: '#ECECEC', notes: '' },
  { slug: 'canada-passport-50x70', country: 'Canada', documentType: 'Passport', widthMm: 50, heightMm: 70, minHeadMm: 31, maxHeadMm: 36, eyeLineFromBottomMinRatio: 0.52, eyeLineFromBottomMaxRatio: 0.64, backgroundHex: '#FFFFFF', notes: '' },
  { slug: 'australia-passport-35x45', country: 'Australia', documentType: 'Passport', widthMm: 35, heightMm: 45, minHeadMm: 32, maxHeadMm: 36, eyeLineFromBottomMinRatio: 0.55, eyeLineFromBottomMaxRatio: 0.68, backgroundHex: '#FFFFFF', notes: '' },
  { slug: 'india-passport-2x2', country: 'India', documentType: 'Passport', widthMm: 50.8, heightMm: 50.8, minHeadMm: 25, maxHeadMm: 35, eyeLineFromBottomMinRatio: 0.55, eyeLineFromBottomMaxRatio: 0.68, backgroundHex: '#FFFFFF', notes: '' },
  { slug: 'china-visa-33x48', country: 'China', documentType: 'Visa', widthMm: 33, heightMm: 48, minHeadMm: 28, maxHeadMm: 33, eyeLineFromBottomMinRatio: 0.55, eyeLineFromBottomMaxRatio: 0.68, backgroundHex: '#FFFFFF', notes: '' },
  { slug: 'japan-passport-35x45', country: 'Japan', documentType: 'Passport', widthMm: 35, heightMm: 45, minHeadMm: 32, maxHeadMm: 36, eyeLineFromBottomMinRatio: 0.55, eyeLineFromBottomMaxRatio: 0.68, backgroundHex: '#FFFFFF', notes: '' },
  { slug: 'turkey-biometric-50x60', country: 'Turkey', documentType: 'Biometric Passport', widthMm: 50, heightMm: 60, minHeadMm: 32, maxHeadMm: 36, eyeLineFromBottomMinRatio: 0.53, eyeLineFromBottomMaxRatio: 0.66, backgroundHex: '#FFFFFF', notes: '' },
  { slug: 'linkedin-headshot-square', country: 'Global', documentType: 'CV Headshot', widthMm: 100, heightMm: 100, minHeadMm: 48, maxHeadMm: 72, eyeLineFromBottomMinRatio: 0.52, eyeLineFromBottomMaxRatio: 0.66, backgroundHex: '#F8FAFC', notes: '' }
];

export function getBiometricSpec(slug: string): BiometricPhotoSpec | undefined {
  return BIOMETRIC_PHOTO_SPECS.find(spec => spec.slug === slug);
}
