import { useState, useEffect, useCallback } from 'react'
import './App.css'

// Import constants and types
import { CHORD_TYPES, PLAY_MODES, type ChordType, type PlayMode } from './constants/music'
import type { PianoKey, RecordedChord } from './types/music'

// Import utilities
import { getMaxInversions, addSeventhToChordType, getOrdinalSuffix, abbreviateChordType, applyInversion, generateChordNotes } from './utils/music'
import { generatePianoKeys, getKeyPosition, getKeyWidth } from './utils/pianoKeys'

// Import hooks
import { useAudioSampler } from './hooks/useAudioSampler'
import { useKeyboardControls } from './hooks/useKeyboardControls'

// Import services
import { AudioService } from './services/audioService'
import * as Tone from 'tone'

function App() {
  // State management
  const [selectedChordType, setSelectedChordType] = useState<ChordType>('major')
  const [selectedInversion, setSelectedInversion] = useState<number>(0)
  const [playMode, setPlayMode] = useState<PlayMode>('chord')
  const [isPlaying, setIsPlaying] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordedChords, setRecordedChords] = useState<RecordedChord[]>([])
  const [isPlayingBack, setIsPlayingBack] = useState(false)
  const [currentlyPlayingIndex, setCurrentlyPlayingIndex] = useState<number>(-1)
  const [octaveShift, setOctaveShift] = useState<number>(0)

  // Audio hook
  const { sampler, playNotes, stopNotes } = useAudioSampler()

  // Generate piano keys
  const pianoKeys = generatePianoKeys(octaveShift)

  // Audio handlers - using sampler directly for now
  const handleNotePlay = useCallback(async (note: string, octave: number) => {
    if (!sampler) return

    // Start audio context if not already started
    if (sampler.context.state !== 'running') {
      await Tone.start()
    }

    const noteString = `${note}${octave}`
    sampler.triggerAttack(noteString)
  }, [sampler])

  const handleNoteStop = useCallback((note: string, octave: number) => {
    if (!sampler) return
    const noteString = `${note}${octave}`
    sampler.triggerRelease(noteString)
  }, [sampler])

  const handleChordPlay = useCallback(async (note: string, octave: number, inversion: number, chordType: ChordType) => {
    if (!sampler) return

    // Start audio context if not already started
    if (sampler.context.state !== 'running') {
      await Tone.start()
    }

    const chordIntervals = [...CHORD_TYPES[chordType]]
    const invertedIntervals = applyInversion(chordIntervals, inversion)
    const chordNotes = generateChordNotes(note, invertedIntervals, octave)
    
    sampler.triggerAttack(chordNotes)
  }, [sampler])

  const handleChordStop = useCallback((note: string, octave: number, inversion: number, chordType: ChordType) => {
    if (!sampler) return
    
    const chordIntervals = [...CHORD_TYPES[chordType]]
    const invertedIntervals = applyInversion(chordIntervals, inversion)
    const chordNotes = generateChordNotes(note, invertedIntervals, octave)
    
    // Stop each note in the chord
    chordNotes.forEach(sampleString => {
      sampler.triggerRelease(sampleString)
    })
  }, [sampler])

  // Recording handlers
  const addChordToRecording = useCallback((key: PianoKey) => {
    if (!isRecording) return
    
    const newChord: RecordedChord = {
      id: Date.now().toString(),
      note: key.note,
      octave: key.octave,
      chordType: selectedChordType,
      inversion: selectedInversion,
      timestamp: Date.now()
    }
    
    setRecordedChords(prev => [...prev, newChord])
  }, [isRecording, selectedChordType, selectedInversion])

  const startRecording = useCallback(() => {
    setIsRecording(true)
    setRecordedChords([])
  }, [])

  const stopRecording = useCallback(() => {
    setIsRecording(false)
  }, [])

  const clearRecording = useCallback(() => {
    setRecordedChords([])
    setCurrentlyPlayingIndex(-1)
  }, [])

  const playBackSequence = useCallback(async () => {
    if (recordedChords.length === 0 || !sampler) return
    
    setIsPlayingBack(true)
    setCurrentlyPlayingIndex(0)
    
    for (let i = 0; i < recordedChords.length; i++) {
      const chord = recordedChords[i]
      setCurrentlyPlayingIndex(i)
      
      await handleChordPlay(chord.note, chord.octave, chord.inversion, chord.chordType)
      
      // Wait for chord duration
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      handleChordStop(chord.note, chord.octave, chord.inversion, chord.chordType)
      
      // Wait between chords
      if (i < recordedChords.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 200))
      }
    }
    
    setIsPlayingBack(false)
    setCurrentlyPlayingIndex(-1)
  }, [recordedChords, sampler, handleChordPlay, handleChordStop])

  // Mouse event handlers
  const handleKeyPress = useCallback((key: PianoKey) => {
    if (playMode === 'note') {
      handleNotePlay(key.note, key.octave)
    } else {
      handleChordPlay(key.note, key.octave, selectedInversion, selectedChordType)
      addChordToRecording(key)
    }
  }, [playMode, selectedInversion, selectedChordType, handleNotePlay, handleChordPlay, addChordToRecording])

  const handleKeyRelease = useCallback((key: PianoKey) => {
    if (playMode === 'note') {
      handleNoteStop(key.note, key.octave)
    } else {
      handleChordStop(key.note, key.octave, selectedInversion, selectedChordType)
    }
  }, [playMode, selectedInversion, selectedChordType, handleNoteStop, handleChordStop])

  // Keyboard controls hook
  useKeyboardControls({
    playMode,
    octaveShift,
    selectedChordType,
    selectedInversion,
    isRecording,
    onNotePlay: handleNotePlay,
    onNoteStop: handleNoteStop,
    onChordPlay: handleChordPlay,
    onChordStop: handleChordStop,
    onAddToRecording: addChordToRecording,
    getMaxInversions: () => getMaxInversions(selectedChordType),
    addSeventhToChordType
  })

  return (
    <div className="app">
      <header className="app-header">
        <h1>🎹 Piano Chords</h1>
        <p>Click on a piano key to play a {playMode === 'note' ? 'note' : 'chord'}</p>
      </header>
      
      <div className="controls">
        <div className="control-group">
          <div className="play-mode-selector">
            <label htmlFor="play-mode">Play Mode:</label>
            <select 
              id="play-mode"
              value={playMode}
              onChange={(e) => setPlayMode(e.target.value as PlayMode)}
            >
              <option value="chord">Chord</option>
              <option value="note">Single Note</option>
            </select>
          </div>

          <div className="octave-shift-selector">
            <label htmlFor="octave-shift">Octave Shift:</label>
            <select
              id="octave-shift"
              value={octaveShift}
              onChange={(e) => setOctaveShift(Number(e.target.value))}
            >
              <option value={-2}>-2 Octaves</option>
              <option value={-1}>-1 Octave</option>
              <option value={0}>Normal</option>
              <option value={1}>+1 Octave</option>
              <option value={2}>+2 Octaves</option>
            </select>
          </div>

          {playMode === 'chord' && (
            <>
              <div className="chord-selector">
                <label htmlFor="chord-type">Chord Type:</label>
                <select
                  id="chord-type"
                  value={selectedChordType}
                  onChange={(e) => {
                    setSelectedChordType(e.target.value as ChordType)
                    setSelectedInversion(0) // Reset inversion when chord type changes
                  }}
                >
                  {Object.keys(CHORD_TYPES).map(type => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="inversion-selector">
                <label htmlFor="inversion">Inversion:</label>
                <select 
                  id="inversion"
                  value={selectedInversion} 
                  onChange={(e) => setSelectedInversion(Number(e.target.value))}
                >
                  {Array.from({ length: getMaxInversions(selectedChordType) + 1 }, (_, i) => (
                    <option key={i} value={i}>
                      {i === 0 ? 'Root Position' : `${i}${getOrdinalSuffix(i)} Inversion`}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="piano-container">
        <div className="piano">
          {pianoKeys.map((key) => {
            const position = getKeyPosition(key)
            const width = getKeyWidth(key)
            const isCurrentlyPlaying = currentlyPlayingIndex >= 0 && 
              recordedChords[currentlyPlayingIndex]?.note === key.note && 
              recordedChords[currentlyPlayingIndex]?.octave === key.octave

            return (
              <div
                key={`${key.note}-${key.octave}`}
                className={`piano-key ${key.isBlack ? 'black' : 'white'} ${isCurrentlyPlaying ? 'playing' : ''}`}
                style={{
                  left: position.left,
                  width: width,
                  zIndex: position.zIndex
                }}
                onMouseDown={() => handleKeyPress(key)}
                onMouseUp={() => handleKeyRelease(key)}
                onMouseLeave={() => handleKeyRelease(key)}
              >
                <span className="key-label">{key.note}{key.octave}</span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="info">
        <p>Current mode: <strong>{playMode === 'note' ? 'Single Note' : 'Chord'}</strong></p>
        {playMode === 'chord' && (
          <>
            <p>Chord type: <strong>{selectedChordType}</strong></p>
            <p>Inversion: <strong>{selectedInversion === 0 ? 'Root Position' : `${selectedInversion}${getOrdinalSuffix(selectedInversion)} Inversion`}</strong></p>
            <p>Intervals: {applyInversion([...CHORD_TYPES[selectedChordType]], selectedInversion).join(', ')}</p>
          </>
        )}
      </div>

      {playMode === 'chord' && (
        <div className="recording-section">
          <div className="recording-controls">
            <button 
              className={`record-button ${isRecording ? 'recording' : ''}`}
              onClick={isRecording ? stopRecording : startRecording}
            >
              {isRecording ? '⏹️ Stop Recording' : '🔴 Start Recording'}
            </button>
            
            <button 
              className="play-button"
              onClick={playBackSequence}
              disabled={recordedChords.length === 0 || isPlayingBack}
            >
              {isPlayingBack ? '⏸️ Playing...' : '▶️ Play Sequence'}
            </button>
            
            {recordedChords.length > 0 && (
              <button 
                className="clear-button"
                onClick={clearRecording}
                disabled={isRecording || isPlayingBack}
              >
                🗑️ Clear
              </button>
            )}
          </div>

          {recordedChords.length > 0 && (
            <div className="chord-sequence">
              <h3>Recorded Chord Sequence:</h3>
              <div className="chord-list">
                {recordedChords.map((chord, index) => (
                  <div 
                    key={chord.id} 
                    className={`chord-item ${currentlyPlayingIndex === index ? 'playing' : ''}`}
                  >
                    <span className="chord-details">
                      {chord.note}{chord.octave} {abbreviateChordType(chord.chordType)}
                      {chord.inversion > 0 && ` (${chord.inversion}${getOrdinalSuffix(chord.inversion)} inv)`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default App
