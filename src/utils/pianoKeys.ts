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
export const getKeyPosition = (key: PianoKey, octaveShift: number = 0): { left: string; zIndex: number } => {
  const noteIndex = NOTES.indexOf(key.note)
  
  // Calculate the base octave for positioning (lowest octave in the shifted range)
  const baseOctave = 4 + octaveShift
  
  // Calculate octave offset (each octave has 7 white keys)
  const octaveOffset = (key.octave - baseOctave) * 7
  
  // Total white keys across both octaves = 14
  const totalWhiteKeys = 14
  const whiteKeyWidthPercent = 100 / totalWhiteKeys
  
  if (key.isBlack) {
    // For black keys, find the white key to the left and center between them
    const whiteKeyIndex = getWhiteKeyIndex(noteIndex)
    const leftPosition = (whiteKeyIndex + octaveOffset) * whiteKeyWidthPercent + (whiteKeyWidthPercent * 0.6)
    return {
      left: `${leftPosition}%`,
      zIndex: 10
    }
  } else {
    // For white keys, use their natural position
    const whiteKeyIndex = getWhiteKeyIndex(noteIndex)
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