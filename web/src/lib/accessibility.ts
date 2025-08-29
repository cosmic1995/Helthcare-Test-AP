/**
 * Accessibility utilities for WCAG 2.1 AA compliance
 * Healthcare Compliance SaaS Platform
 */

// ARIA live region announcements for screen readers
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
  const announcement = document.createElement('div')
  announcement.setAttribute('aria-live', priority)
  announcement.setAttribute('aria-atomic', 'true')
  announcement.className = 'sr-only'
  announcement.textContent = message
  
  document.body.appendChild(announcement)
  
  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement)
  }, 1000)
}

// Focus management utilities
export function trapFocus(element: HTMLElement) {
  const focusableElements = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  ) as NodeListOf<HTMLElement>
  
  const firstFocusable = focusableElements[0]
  const lastFocusable = focusableElements[focusableElements.length - 1]
  
  function handleTabKey(e: KeyboardEvent) {
    if (e.key !== 'Tab') return
    
    if (e.shiftKey) {
      if (document.activeElement === firstFocusable) {
        lastFocusable.focus()
        e.preventDefault()
      }
    } else {
      if (document.activeElement === lastFocusable) {
        firstFocusable.focus()
        e.preventDefault()
      }
    }
  }
  
  element.addEventListener('keydown', handleTabKey)
  
  // Return cleanup function
  return () => {
    element.removeEventListener('keydown', handleTabKey)
  }
}

// Skip link functionality
export function createSkipLink(targetId: string, text: string = 'Skip to main content') {
  const skipLink = document.createElement('a')
  skipLink.href = `#${targetId}`
  skipLink.textContent = text
  skipLink.className = 'sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:p-4 focus:bg-primary focus:text-primary-foreground focus:no-underline'
  
  skipLink.addEventListener('click', (e) => {
    e.preventDefault()
    const target = document.getElementById(targetId)
    if (target) {
      target.focus()
      target.scrollIntoView({ behavior: 'smooth' })
    }
  })
  
  return skipLink
}

// Color contrast utilities
export function getContrastRatio(color1: string, color2: string): number {
  const getLuminance = (color: string): number => {
    // Convert hex to RGB
    const hex = color.replace('#', '')
    const r = parseInt(hex.substr(0, 2), 16) / 255
    const g = parseInt(hex.substr(2, 2), 16) / 255
    const b = parseInt(hex.substr(4, 2), 16) / 255
    
    // Calculate relative luminance
    const sRGB = [r, g, b].map(c => {
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    })
    
    return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2]
  }
  
  const lum1 = getLuminance(color1)
  const lum2 = getLuminance(color2)
  const brightest = Math.max(lum1, lum2)
  const darkest = Math.min(lum1, lum2)
  
  return (brightest + 0.05) / (darkest + 0.05)
}

export function meetsWCAGAA(foreground: string, background: string, isLargeText: boolean = false): boolean {
  const ratio = getContrastRatio(foreground, background)
  return isLargeText ? ratio >= 3 : ratio >= 4.5
}

export function meetsWCAGAAA(foreground: string, background: string, isLargeText: boolean = false): boolean {
  const ratio = getContrastRatio(foreground, background)
  return isLargeText ? ratio >= 4.5 : ratio >= 7
}

// Keyboard navigation utilities
export const KEYBOARD_KEYS = {
  ENTER: 'Enter',
  SPACE: ' ',
  TAB: 'Tab',
  ESCAPE: 'Escape',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  HOME: 'Home',
  END: 'End',
  PAGE_UP: 'PageUp',
  PAGE_DOWN: 'PageDown'
} as const

export function handleArrowNavigation(
  event: KeyboardEvent,
  items: HTMLElement[],
  currentIndex: number,
  orientation: 'horizontal' | 'vertical' = 'vertical'
): number {
  const { key } = event
  let newIndex = currentIndex
  
  if (orientation === 'vertical') {
    if (key === KEYBOARD_KEYS.ARROW_UP) {
      newIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1
      event.preventDefault()
    } else if (key === KEYBOARD_KEYS.ARROW_DOWN) {
      newIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0
      event.preventDefault()
    }
  } else {
    if (key === KEYBOARD_KEYS.ARROW_LEFT) {
      newIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1
      event.preventDefault()
    } else if (key === KEYBOARD_KEYS.ARROW_RIGHT) {
      newIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0
      event.preventDefault()
    }
  }
  
  if (key === KEYBOARD_KEYS.HOME) {
    newIndex = 0
    event.preventDefault()
  } else if (key === KEYBOARD_KEYS.END) {
    newIndex = items.length - 1
    event.preventDefault()
  }
  
  if (newIndex !== currentIndex) {
    items[newIndex]?.focus()
  }
  
  return newIndex
}

// Reduced motion utilities
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function respectReducedMotion<T>(
  normalValue: T,
  reducedValue: T
): T {
  return prefersReducedMotion() ? reducedValue : normalValue
}

// High contrast mode detection
export function prefersHighContrast(): boolean {
  return window.matchMedia('(prefers-contrast: high)').matches
}

// Screen reader utilities
export function isScreenReaderActive(): boolean {
  // Check for common screen reader indicators
  return !!(
    navigator.userAgent.includes('NVDA') ||
    navigator.userAgent.includes('JAWS') ||
    navigator.userAgent.includes('VoiceOver') ||
    window.speechSynthesis ||
    document.querySelector('[aria-hidden="true"]')
  )
}

// Form accessibility utilities
export function associateLabel(inputId: string, labelText: string): void {
  const input = document.getElementById(inputId)
  const label = document.querySelector(`label[for="${inputId}"]`)
  
  if (input && !label) {
    const newLabel = document.createElement('label')
    newLabel.setAttribute('for', inputId)
    newLabel.textContent = labelText
    newLabel.className = 'sr-only'
    input.parentNode?.insertBefore(newLabel, input)
  }
}

export function addErrorAnnouncement(inputId: string, errorMessage: string): void {
  const input = document.getElementById(inputId)
  if (!input) return
  
  // Remove existing error announcement
  const existingError = document.getElementById(`${inputId}-error`)
  if (existingError) {
    existingError.remove()
  }
  
  // Create new error announcement
  const errorElement = document.createElement('div')
  errorElement.id = `${inputId}-error`
  errorElement.setAttribute('role', 'alert')
  errorElement.setAttribute('aria-live', 'assertive')
  errorElement.className = 'text-sm text-red-600 mt-1'
  errorElement.textContent = errorMessage
  
  input.setAttribute('aria-describedby', `${inputId}-error`)
  input.setAttribute('aria-invalid', 'true')
  input.parentNode?.appendChild(errorElement)
}

export function clearErrorAnnouncement(inputId: string): void {
  const input = document.getElementById(inputId)
  const errorElement = document.getElementById(`${inputId}-error`)
  
  if (input) {
    input.removeAttribute('aria-describedby')
    input.removeAttribute('aria-invalid')
  }
  
  if (errorElement) {
    errorElement.remove()
  }
}

// Loading state announcements
export function announceLoadingState(isLoading: boolean, message?: string): void {
  const defaultMessage = isLoading ? 'Loading content' : 'Content loaded'
  announceToScreenReader(message || defaultMessage, 'polite')
}

// Table accessibility utilities
export function makeTableAccessible(tableElement: HTMLTableElement): void {
  // Add table caption if missing
  if (!tableElement.caption) {
    const caption = document.createElement('caption')
    caption.textContent = 'Data table'
    caption.className = 'sr-only'
    tableElement.appendChild(caption)
  }
  
  // Ensure headers are properly associated
  const headers = tableElement.querySelectorAll('th')
  headers.forEach((header, index) => {
    if (!header.id) {
      header.id = `header-${index}`
    }
    if (!header.getAttribute('scope')) {
      header.setAttribute('scope', 'col')
    }
  })
  
  // Associate data cells with headers
  const rows = tableElement.querySelectorAll('tbody tr')
  rows.forEach(row => {
    const cells = row.querySelectorAll('td')
    cells.forEach((cell, cellIndex) => {
      const header = headers[cellIndex]
      if (header && !cell.getAttribute('headers')) {
        cell.setAttribute('headers', header.id)
      }
    })
  })
}

// Export all utilities
export const a11y = {
  announceToScreenReader,
  trapFocus,
  createSkipLink,
  getContrastRatio,
  meetsWCAGAA,
  meetsWCAGAAA,
  handleArrowNavigation,
  prefersReducedMotion,
  respectReducedMotion,
  prefersHighContrast,
  isScreenReaderActive,
  associateLabel,
  addErrorAnnouncement,
  clearErrorAnnouncement,
  announceLoadingState,
  makeTableAccessible,
  KEYBOARD_KEYS
}
