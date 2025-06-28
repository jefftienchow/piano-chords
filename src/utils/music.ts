import { NOTES, CHORD_TYPES, type ChordType } from '../constants/music'

// Apply inversion to chord intervals
export const applyInversion = (intervals: number[], inversion: number): number[] => {
  if (inversion === 0) return intervals
  
  const result = [...intervals]
  for (let i = 0; i < inversion; i++) {
    const first = result.shift()!
    result.push(first + 12)
  }
  
  return result
}

// Generate chord notes from root note, intervals, and octave
export const generateChordNotes = (rootNote: string, intervals: number[], octave: number): string[] => {
  return intervals.map(interval => {
    const noteIndex = NOTES.indexOf(rootNote)
    const newIndex = (noteIndex + interval) % 12
    return `${NOTES[newIndex]}${octave + Math.floor((noteIndex + interval) / 12)}`
  })
}

// Get max inversions for a chord type
export const getMaxInversions = (chordType: ChordType): number => {
  const chordIntervals = CHORD_TYPES[chordType]
  return chordIntervals.length - 1
}

// Add 7th to current chord type
export const addSeventhToChordType = (chordType: ChordType): ChordType => {
  switch (chordType) {
    case 'major':
      return 'major7'
    case 'minor':
      return 'minor7'
    case 'diminished':
      return 'diminished7'
    case 'augmented':
      return 'dominant7' // Augmented doesn't have a standard 7th, use dominant 7th
    case 'major7':
    case 'minor7':
    case 'dominant7':
    case 'diminished7':
      return chordType // Already a 7th chord, keep as is
    default:
      return 'dominant7' // Fallback
  }
}

// Generate ordinal suffix for inversion display
export const getOrdinalSuffix = (num: number): string => {
  const j = num % 10
  const k = num % 100
  if (j === 1 && k !== 11) {
    return "st"
  }
  if (j === 2 && k !== 12) {
    return "nd"
  }
  if (j === 3 && k !== 13) {
    return "rd"
  }
  return "th"
}

// Abbreviate chord type for display
export const abbreviateChordType = (chordType: ChordType): string => {
  switch (chordType) {
    case 'major':
      return 'Maj'
    case 'minor':
      return 'min'
    case 'diminished':
      return 'dim'
    case 'augmented':
      return 'aug'
    case 'major7':
      return 'Maj7'
    case 'minor7':
      return 'min7'
    case 'dominant7':
      return '7'
    case 'diminished7':
      return 'dim7'
    default:
      return chordType
  }
} 