// Define note names and their frequencies
export const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
export const OCTAVES = [4, 5] // Show 2 octaves at a time

// Define chord qualities (triads only)
export const CHORD_QUALITIES = {
  major: [0, 4, 7],
  minor: [0, 3, 7],
  diminished: [0, 3, 6],
  augmented: [0, 4, 8],
} as const

export type ChordQuality = keyof typeof CHORD_QUALITIES

// Define chord types
export const CHORD_TYPES = {
  triad: 'triad',
  seventh: 'seventh'
} as const

export type ChordType = keyof typeof CHORD_TYPES

// Define play modes
export const PLAY_MODES = {
  note: 'note',
  chord: 'chord'
} as const

export type PlayMode = keyof typeof PLAY_MODES

// Keyboard to note mapping
export const KEY_TO_NOTE: Record<string, string> = {
  'a': 'C',
  's': 'D', 
  'd': 'E',
  'f': 'F',
  'g': 'G',
  'h': 'A',
  'j': 'B',
  'w': 'C#',
  'e': 'D#',
  't': 'F#',
  'y': 'G#',
  'u': 'A#'
}

// Available piano samples
export const AVAILABLE_SAMPLES = ['A', 'C', 'D#', 'F#'] 