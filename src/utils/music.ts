import { NOTES, CHORD_QUALITIES, CHORD_TYPES, type ChordType, type ChordQuality } from '../constants/music'

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

// Get chord intervals based on quality and type
export const getChordIntervals = (quality: ChordQuality, type: ChordType): number[] => {
  const baseIntervals = [...CHORD_QUALITIES[quality]]
  
  if (type === 'triad') {
    return baseIntervals
  } else if (type === 'seventh') {
    // Add appropriate 7th based on quality
    switch (quality) {
      case 'major':
        return [...baseIntervals, 11] // Major 7th
      case 'minor':
        return [...baseIntervals, 10] // Minor 7th
      case 'diminished':
        return [...baseIntervals, 9] // Diminished 7th
      case 'augmented':
        return [...baseIntervals, 10] // Dominant 7th (augmented doesn't have standard 7th)
      default:
        return [...baseIntervals, 10] // Default to dominant 7th
    }
  }
  
  return baseIntervals
}

// Get max inversions for a chord
export const getMaxInversions = (quality: ChordQuality, type: ChordType): number => {
  const intervals = getChordIntervals(quality, type)
  return intervals.length - 1
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

// Abbreviate chord for display
export const abbreviateChord = (quality: ChordQuality, type: ChordType): string => {
  let qualityAbbr = ''
  switch (quality) {
    case 'major':
      qualityAbbr = 'Maj'
      break
    case 'minor':
      qualityAbbr = 'min'
      break
    case 'diminished':
      qualityAbbr = 'dim'
      break
    case 'augmented':
      qualityAbbr = 'aug'
      break
    default:
      qualityAbbr = quality
  }
  
  if (type === 'seventh') {
    qualityAbbr += '7'
  }
  
  return qualityAbbr
} 