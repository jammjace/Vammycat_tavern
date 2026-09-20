export function textCacheKey(text) {
  return JSON.stringify([text.text, text.style.toJSON(), text.padding, text.lineSpacing, text.letterSpacing]);
}

export function fontMetricsKey(style) {
  const size = typeof style.fontSize === 'number' ? `${style.fontSize}px` : style.fontSize;
  return `${style.fontStyle || ''}|${style.fontFamily || 'Courier'}|${size || '16px'}`;
}
