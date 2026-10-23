/**
 * Marks text in another language so screen readers pronounce it correctly (WCAG 3.1.2).
 * Only Korean is needed today; returns undefined for everything else so no attribute is rendered.
 */
export const langOf = (text: string): "ko" | undefined => (/[ᄀ-ᇿ㄰-㆏가-힯]/.test(text) ? "ko" : undefined);
