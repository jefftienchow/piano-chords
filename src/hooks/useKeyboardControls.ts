import { useEffect } from 'react'
import { KEY_TO_NOTE, type PlayMode, type ChordType, type ChordQuality } from '../constants/music'
import type { PianoKey } from '../types/music'

interface UseKeyboardControlsProps {
  playMode: PlayMode
  octaveShift: number
  selectedChordQuality: ChordQuality
  selectedChordType: ChordType
  selectedInversion: number
  isRecording: boolean
  onNotePlay: (note: string, octave: number) => void
  onNoteStop: (note: string, octave: number) => void
  onChordPlay: (note: string, octave: number, inversion: number, quality: ChordQuality, type: ChordType) => void
  onChordStop: (note: string, octave: number, inversion: number, quality: ChordQuality, type: ChordType) => void
  onAddToRecording: (key: PianoKey) => void
  getMaxInversions: () => number
}

export const useKeyboardControls = ({
  playMode,
  octaveShift,
  selectedChordQuality,
  selectedChordType,
  selectedInversion,
  isRecording,
  onNotePlay,
  onNoteStop,
  onChordPlay,
  onChordStop,
  onAddToRecording,
  getMaxInversions
}: UseKeyboardControlsProps) => {
  useEffect(() => {
    let temporaryInversion: number | null = null
    let temporaryChordType: ChordType | null = null
    let activeChords: Map<string, { inversion: number; quality: ChordQuality; chordType: ChordType }> = new Map()
    
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger if typing in an input field
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLSelectElement) {
        return
      }

      const key = event.key.toLowerCase()
      const note = KEY_TO_NOTE[key]
      
      if (note && !event.repeat) { // !event.repeat prevents key repeat
        const isShiftPressed = event.shiftKey
        const baseOctave = 4 + octaveShift // Lower octave
        const octave = isShiftPressed ? baseOctave + 1 : baseOctave
        
        if (playMode === 'note') {
          onNotePlay(note, octave)
        } else {
          // Use temporary inversion and chord type if available, otherwise use selected ones
          const currentInversion = temporaryInversion !== null ? temporaryInversion : selectedInversion
          const currentChordType = temporaryChordType !== null ? temporaryChordType : selectedChordType
          onChordPlay(note, octave, currentInversion, selectedChordQuality, currentChordType)
          // Track which inversion and chord quality were used for this chord
          const chordKey = `${note}${octave}`
          activeChords.set(chordKey, { inversion: currentInversion, quality: selectedChordQuality, chordType: currentChordType })
          // Add to recording if recording is active
          const keyData = { note, octave, isBlack: note.includes('#') } as PianoKey
          onAddToRecording(keyData)
        }
      }
      
      // Handle temporary inversion changes with number keys
      if (['1', '2', '3'].includes(key) && playMode === 'chord') {
        const inversionNumber = parseInt(key) // Convert 1,2,3 to 1,2,3 (not 0,1,2)
        const maxInversions = getMaxInversions()
        
        if (inversionNumber <= maxInversions) {
          temporaryInversion = inversionNumber
        }
      }
      
      // Handle temporary chord type change with 7 key
      if (key === '7' && playMode === 'chord') {
        temporaryChordType = 'seventh'
      }
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      // Don't trigger if typing in an input field
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLSelectElement) {
        return
      }

      const key = event.key.toLowerCase()
      const note = KEY_TO_NOTE[key]
      
      if (note) {
        const isShiftPressed = event.shiftKey
        const baseOctave = 4 + octaveShift // Lower octave
        const octave = isShiftPressed ? baseOctave + 1 : baseOctave
        
        if (playMode === 'note') {
          onNoteStop(note, octave)
        } else {
          // Get the inversion and chord quality that were used to play this chord
          const chordKey = `${note}${octave}`
          const chordData = activeChords.get(chordKey)
          if (chordData) {
            onChordStop(note, octave, chordData.inversion, chordData.quality, chordData.chordType)
            activeChords.delete(chordKey)
          }
        }
      }
      
      // Handle temporary inversion release
      if (['1', '2', '3'].includes(key) && playMode === 'chord') {
        temporaryInversion = null
      }
      
      // Handle temporary chord type release
      if (key === '7' && temporaryChordType) {
        temporaryChordType = null
      }
    }

    // Add event listeners
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keyup', handleKeyUp)

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keyup', handleKeyUp)
    }
  }, [playMode, octaveShift, selectedChordQuality, selectedChordType, selectedInversion, isRecording, onNotePlay, onNoteStop, onChordPlay, onChordStop, onAddToRecording, getMaxInversions])
} 