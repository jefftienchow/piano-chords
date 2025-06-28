import { useEffect } from 'react'
import { KEY_TO_NOTE, type PlayMode } from '../constants/music'
import type { ChordType } from '../constants/music'
import type { PianoKey } from '../types/music'

interface UseKeyboardControlsProps {
  playMode: PlayMode
  octaveShift: number
  selectedChordType: ChordType
  selectedInversion: number
  isRecording: boolean
  onNotePlay: (note: string, octave: number) => void
  onNoteStop: (note: string, octave: number) => void
  onChordPlay: (note: string, octave: number, inversion: number, chordType: ChordType) => void
  onChordStop: (note: string, octave: number, inversion: number, chordType: ChordType) => void
  onAddToRecording: (key: PianoKey) => void
  getMaxInversions: () => number
  addSeventhToChordType: (chordType: ChordType) => ChordType
}

export const useKeyboardControls = ({
  playMode,
  octaveShift,
  selectedChordType,
  selectedInversion,
  isRecording,
  onNotePlay,
  onNoteStop,
  onChordPlay,
  onChordStop,
  onAddToRecording,
  getMaxInversions,
  addSeventhToChordType
}: UseKeyboardControlsProps) => {
  useEffect(() => {
    let temporaryInversion: number | null = null
    let temporaryChordType: ChordType | null = null
    let activeChords: Map<string, { inversion: number; chordType: ChordType }> = new Map()
    
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
          onChordPlay(note, octave, currentInversion, currentChordType)
          // Track which inversion and chord type were used for this chord
          activeChords.set(`${note}${octave}`, { inversion: currentInversion, chordType: currentChordType })
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
        const seventhChordType = addSeventhToChordType(selectedChordType)
        temporaryChordType = seventhChordType
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
          // Get the inversion and chord type that were used to play this chord
          const chordKey = `${note}${octave}`
          const chordData = activeChords.get(chordKey)
          const inversionUsed = chordData?.inversion ?? selectedInversion
          const chordTypeUsed = chordData?.chordType ?? selectedChordType
          onChordStop(note, octave, inversionUsed, chordTypeUsed)
          activeChords.delete(chordKey) // Clean up tracking
        }
      }
      
      // Handle temporary inversion release
      if (['1', '2', '3'].includes(key) && playMode === 'chord') {
        temporaryInversion = null
      }
      
      // Handle temporary chord type release
      if (key === '7' && playMode === 'chord') {
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
  }, [playMode, octaveShift, selectedChordType, selectedInversion, isRecording, onNotePlay, onNoteStop, onChordPlay, onChordStop, onAddToRecording, getMaxInversions, addSeventhToChordType])
} 