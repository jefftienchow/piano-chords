import * as Tone from 'tone'
import { NOTES, OCTAVES } from '../constants/music'
import type { PianoKey } from '../types/music'

// Generate piano keys with octave shift
export const generatePianoKeys = (octaveShift: number): PianoKey[] => {
  const keys: PianoKey[] = []
  let globalIndex = 0
  
  // Apply octave shift to the base octaves
  const shiftedOctaves = OCTAVES.map(octave => octave + octaveShift)
  
  shiftedOctaves.forEach(octave => {
    NOTES.forEach((note, noteIndex) => {
      const isBlack = note.includes('#')
      const frequency = Tone.Frequency(`${note}${octave}`).toFrequency()
      
      keys.push({
        note,
        isBlack,
        octave,
        frequency,
        globalIndex
      })
      
      globalIndex++
    })
  })
  
  return keys
}

// Get key position for CSS styling
export const getKeyPosition = (key: PianoKey): { left: string; zIndex: number } => {
  const noteIndex = NOTES.indexOf(key.note)
  const whiteKeyIndex = getWhiteKeyIndex(noteIndex)
  
  // Calculate octave offset (each octave has 7 white keys)
  const octaveOffset = (key.octave - 4) * 7 // 4 is the base octave
  
  // Total white keys across both octaves = 14
  const totalWhiteKeys = 14
  const whiteKeyWidthPercent = 100 / totalWhiteKeys
  
  if (key.isBlack) {
    const blackKeyOffset = getBlackKeyOffset(noteIndex)
    const leftPosition = (whiteKeyIndex + octaveOffset) * whiteKeyWidthPercent + blackKeyOffset
    return {
      left: `${leftPosition}%`,
      zIndex: 10
    }
  } else {
    const leftPosition = (whiteKeyIndex + octaveOffset) * whiteKeyWidthPercent
    return {
      left: `${leftPosition}%`,
      zIndex: 1
    }
  }
}

// Get white key index for positioning
const getWhiteKeyIndex = (noteIndex: number): number => {
  const whiteKeys = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
  const note = NOTES[noteIndex]
  return whiteKeys.indexOf(note.replace('#', ''))
}

// Get black key offset for positioning (as percentage)
const getBlackKeyOffset = (noteIndex: number): number => {
  const note = NOTES[noteIndex]
  const totalWhiteKeys = 14
  const whiteKeyWidthPercent = 100 / totalWhiteKeys
  
  switch (note) {
    case 'C#':
    case 'D#':
      return whiteKeyWidthPercent * 0.6 // 60% of white key width
    case 'F#':
    case 'G#':
    case 'A#':
      return whiteKeyWidthPercent * 0.4 // 40% of white key width
    default:
      return 0
  }
}

// Get key width for CSS styling (as percentage)
export const getKeyWidth = (key: PianoKey): string => {
  const totalWhiteKeys = 14
  const whiteKeyWidthPercent = 100 / totalWhiteKeys
  
  if (key.isBlack) {
    return `${whiteKeyWidthPercent * 0.6}%` // 60% of white key width
  } else {
    return `${whiteKeyWidthPercent}%` // Full white key width
  }
} 