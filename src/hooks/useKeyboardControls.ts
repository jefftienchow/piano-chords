import { useEffect, useRef } from 'react'
import { KEY_TO_NOTE, type PlayMode, type ChordType, type ChordQuality } from '../constants/music'
import type { PianoKey } from '../types/music'
import { getChordIntervals, applyInversion, generateChordNotes } from '../utils/music'

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
  // Use refs to maintain state across renders
  const activeChordsRef = useRef<Map<string, { inversion: number; quality: ChordQuality; chordType: ChordType }>>(new Map())
  const temporaryInversionRef = useRef<number | null>(null)
  const temporaryChordTypeRef = useRef<ChordType | null>(null)

  useEffect(() => {
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
          const currentInversion = temporaryInversionRef.current !== null ? temporaryInversionRef.current : selectedInversion
          const currentChordType = temporaryChordTypeRef.current !== null ? temporaryChordTypeRef.current : selectedChordType
          onChordPlay(note, octave, currentInversion, selectedChordQuality, currentChordType)
          // Track which inversion and chord quality were used for this chord
          const chordKey = `${note}${octave}`
          activeChordsRef.current.set(chordKey, { inversion: currentInversion, quality: selectedChordQuality, chordType: currentChordType })
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
          temporaryInversionRef.current = inversionNumber
        }
      }
      
      // Handle temporary chord type change with 7 key
      if (key === '7' && playMode === 'chord') {
        temporaryChordTypeRef.current = 'seventh'
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
          const chordData = activeChordsRef.current.get(chordKey)
          
          if (chordData) {
            // Use onChordStop to properly stop the chord
            onChordStop(note, octave, chordData.inversion, chordData.quality, chordData.chordType)
            activeChordsRef.current.delete(chordKey)
          }
        }
      }
      
      // Handle temporary inversion release
      if (['1', '2', '3'].includes(key) && playMode === 'chord') {
        temporaryInversionRef.current = null
      }
      
      // Handle temporary chord type release
      if (key === '7' && temporaryChordTypeRef.current) {
        temporaryChordTypeRef.current = null
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