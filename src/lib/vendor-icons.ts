/**
 * Maps icon name strings (stored in DB) to emoji characters.
 * The vendor_categories table stores icon names like "sparkles", "building", etc.
 */
const ICON_MAP: Record<string, string> = {
  building: '🏛️',
  camera: '📷',
  video: '🎥',
  utensils: '🍽️',
  flower: '💐',
  music: '🎵',
  cake: '🎂',
  shirt: '👔',
  sparkles: '✨',
  mail: '💌',
  car: '🚗',
  clipboard: '📋',
  users: '👥',
  tent: '⛺',
  plus: '➕',
  heart: '💒',
  bed: '🏨',
}

export function getVendorEmoji(iconName: string | null | undefined): string {
  if (!iconName) return ''
  const key = iconName.trim().toLowerCase()
  return ICON_MAP[key] ?? iconName
}
