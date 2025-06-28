import type { ChordType } from '../constants/music'

export interface PianoKey {
  note: string
  isBlack: boolean
  octave: number
  frequency: number
  globalIndex: number
}

export interface RecordedChord {
  id: string
  note: string
  octave: number
  chordType: ChordType
  inversion: number
  timestamp: number
}

export interface ChordData {
  inversion: number
  chordType: ChordType
} 