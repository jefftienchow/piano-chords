import { useState, useEffect } from 'react'
import * as Tone from 'tone'
import './App.css'

// Define note names and their frequencies
const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const OCTAVES = [4, 5] // Reduced to 2 octaves

// Define chord types
const CHORD_TYPES = {
  major: [0, 4, 7],
  minor: [0, 3, 7],
  diminished: [0, 3, 6],
  augmented: [0, 4, 8],
  major7: [0, 4, 7, 11],
  minor7: [0, 3, 7, 10],
  dominant7: [0, 4, 7, 10],
  diminished7: [0, 3, 6, 9],
}

// Define play modes
const PLAY_MODES = {
  note: 'note',
  chord: 'chord'
} as const

interface PianoKey {
  note: string
  isBlack: boolean
  octave: number
  frequency: number
  globalIndex: number
}

interface RecordedChord {
  id: string
  note: string
  octave: number
  chordType: keyof typeof CHORD_TYPES
  inversion: number
  timestamp: number
}

function App() {
  const [sampler, setSampler] = useState<Tone.Sampler | null>(null)
  const [selectedChordType, setSelectedChordType] = useState<keyof typeof CHORD_TYPES>('major')
  const [selectedInversion, setSelectedInversion] = useState<number>(0)
  const [playMode, setPlayMode] = useState<keyof typeof PLAY_MODES>('chord')
  const [isPlaying, setIsPlaying] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordedChords, setRecordedChords] = useState<RecordedChord[]>([])
  const [isPlayingBack, setIsPlayingBack] = useState(false)
  const [currentlyPlayingIndex, setCurrentlyPlayingIndex] = useState<number>(-1)
  const [octaveShift, setOctaveShift] = useState<number>(0)

  // Keyboard to note mapping
  const KEY_TO_NOTE: Record<string, string> = {
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

  // Initialize audio context and sampler
  useEffect(() => {
    // Create sample URLs for only the available notes
    const sampleUrls: Record<string, string> = {}
    
    // Available notes from the sample set
    const availableNotes = ['A', 'C', 'D#', 'F#']
    for (let octave = 0; octave <= 8; octave++) {
      availableNotes.forEach(note => {
        const noteName = `${note}${octave}`
        sampleUrls[noteName] = `${note.replace('#', 'sharp')}${octave}v4.wav`
      })
    }
    console.log(sampleUrls)

    const newSampler = new Tone.Sampler({
      urls: sampleUrls,
      baseUrl: "/samples/", // put your folder path here
      release: 1,
      onload: () => {
        console.log("Samples loaded")
      }
    }).toDestination()

    setSampler(newSampler)

    return () => {
      newSampler.dispose()
    }
  }, [])

  // Function to add 7th to current chord type
  const addSeventhToChordType = (chordType: keyof typeof CHORD_TYPES): keyof typeof CHORD_TYPES => {
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

  // Play chord function with specific inversion
  const playChordWithInversion = async (rootNote: string, octave: number, inversion: number) => {
    if (!sampler) return

    // Start audio context if not already started
    if (Tone.context.state !== 'running') {
      await Tone.start()
    }

    const chordIntervals = CHORD_TYPES[selectedChordType]
    const invertedIntervals = applyInversion(chordIntervals, inversion)
    
    const chordNotes = invertedIntervals.map(interval => {
      const noteIndex = NOTES.indexOf(rootNote)
      const newIndex = (noteIndex + interval) % 12
      return `${NOTES[newIndex]}${octave + Math.floor((noteIndex + interval) / 12)}`
    })

    sampler.triggerAttack(chordNotes)
  }

  // Stop chord function with specific inversion
  const stopChordWithInversion = (rootNote: string, octave: number, inversion: number) => {
    if (!sampler) return
    
    const chordIntervals = CHORD_TYPES[selectedChordType]
    const invertedIntervals = applyInversion(chordIntervals, inversion)
    
    const chordNotes = invertedIntervals.map(interval => {
      const noteIndex = NOTES.indexOf(rootNote)
      const newIndex = (noteIndex + interval) % 12
      return `${NOTES[newIndex]}${octave + Math.floor((noteIndex + interval) / 12)}`
    })

    // Stop each note in the chord
    chordNotes.forEach(sampleString => {
      sampler.triggerRelease(sampleString)
    })
  }

  // Play chord function with specific inversion and chord type
  const playChordWithInversionAndType = async (rootNote: string, octave: number, inversion: number, chordType: keyof typeof CHORD_TYPES) => {
    if (!sampler) return

    // Start audio context if not already started
    if (Tone.context.state !== 'running') {
      await Tone.start()
    }

    const chordIntervals = CHORD_TYPES[chordType]
    const invertedIntervals = applyInversion(chordIntervals, inversion)
    
    const chordNotes = invertedIntervals.map(interval => {
      const noteIndex = NOTES.indexOf(rootNote)
      const newIndex = (noteIndex + interval) % 12
      return `${NOTES[newIndex]}${octave + Math.floor((noteIndex + interval) / 12)}`
    })

    sampler.triggerAttack(chordNotes)
  }

  // Stop chord function with specific inversion and chord type
  const stopChordWithInversionAndType = (rootNote: string, octave: number, inversion: number, chordType: keyof typeof CHORD_TYPES) => {
    if (!sampler) return
    
    const chordIntervals = CHORD_TYPES[chordType]
    const invertedIntervals = applyInversion(chordIntervals, inversion)
    
    const chordNotes = invertedIntervals.map(interval => {
      const noteIndex = NOTES.indexOf(rootNote)
      const newIndex = (noteIndex + interval) % 12
      return `${NOTES[newIndex]}${octave + Math.floor((noteIndex + interval) / 12)}`
    })

    // Stop each note in the chord
    chordNotes.forEach(sampleString => {
      sampler.triggerRelease(sampleString)
    })
  }

  // Generate piano keys with octave shift
  const generatePianoKeys = (): PianoKey[] => {
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

  const pianoKeys = generatePianoKeys()

  // Get max inversions for current chord type
  const getMaxInversions = (): number => {
    const chordIntervals = CHORD_TYPES[selectedChordType]
    return chordIntervals.length - 1
  }

  // Apply inversion to chord intervals
  const applyInversion = (intervals: number[], inversion: number): number[] => {
    if (inversion === 0) return intervals
    
    const result = [...intervals]
    for (let i = 0; i < inversion; i++) {
      const first = result.shift()!
      result.push(first + 12)
    }
    
    return result
  }

  // Play note function
  const playNote = async (note: string, octave: number) => {
    if (!sampler) return

    // Start audio context if not already started
    if (Tone.context.state !== 'running') {
      await Tone.start()
    }

    const noteString = `${note}${octave}`
    sampler.triggerAttack(noteString)
  }

  // Stop note function
  const stopNote = (note: string, octave: number) => {
    if (!sampler) return
    const noteString = `${note}${octave}`
    sampler.triggerRelease(noteString)
  }

  // Play chord function
  const playChord = async (rootNote: string, octave: number) => {
    if (!sampler) return

    // Start audio context if not already started
    if (Tone.context.state !== 'running') {
      await Tone.start()
    }

    const chordIntervals = CHORD_TYPES[selectedChordType]
    const invertedIntervals = applyInversion(chordIntervals, selectedInversion)
    
    const chordNotes = invertedIntervals.map(interval => {
      const noteIndex = NOTES.indexOf(rootNote)
      const newIndex = (noteIndex + interval) % 12
      return `${NOTES[newIndex]}${octave + Math.floor((noteIndex + interval) / 12)}`
    })

    sampler.triggerAttack(chordNotes)
  }

  // Stop chord function
  const stopChord = (rootNote: string, octave: number) => {
    if (!sampler) return
    
    const chordIntervals = CHORD_TYPES[selectedChordType]
    const invertedIntervals = applyInversion(chordIntervals, selectedInversion)
    
    const chordNotes = invertedIntervals.map(interval => {
      const noteIndex = NOTES.indexOf(rootNote)
      const newIndex = (noteIndex + interval) % 12
      return `${NOTES[newIndex]}${octave + Math.floor((noteIndex + interval) / 12)}`
    })

    sampler.triggerRelease(chordNotes)
  }

  // Handle key press (mouse down)
  const handleKeyPress = (key: PianoKey) => {
    if (playMode === 'note') {
      playNote(key.note, key.octave)
    } else {
      playChord(key.note, key.octave)
      // Add to recording if recording is active
      addChordToRecording(key)
    }
  }

  // Handle key release (mouse up)
  const handleKeyRelease = (key: PianoKey) => {
    if (playMode === 'note') {
      stopNote(key.note, key.octave)
    } else {
      stopChord(key.note, key.octave)
    }
  }

  // Start recording
  const startRecording = () => {
    setRecordedChords([])
    setIsRecording(true)
  }

  // Stop recording
  const stopRecording = () => {
    setIsRecording(false)
  }

  // Add chord to recording
  const addChordToRecording = (key: PianoKey) => {
    if (!isRecording || playMode !== 'chord') return

    const newChord: RecordedChord = {
      id: Date.now().toString(),
      note: key.note,
      octave: key.octave,
      chordType: selectedChordType,
      inversion: selectedInversion,
      timestamp: Date.now()
    }

    setRecordedChords(prev => [...prev, newChord])
  }

  // Play back recorded sequence
  const playBackSequence = async () => {
    if (recordedChords.length === 0 || isPlayingBack) return

    setIsPlayingBack(true)
    setCurrentlyPlayingIndex(-1)
    const chordDuration = 1000 // 1 second per chord

    for (let i = 0; i < recordedChords.length; i++) {
      const chord = recordedChords[i]
      
      // Highlight current chord
      setCurrentlyPlayingIndex(i)
      
      // Play the chord
      const chordIntervals = CHORD_TYPES[chord.chordType]
      const invertedIntervals = applyInversion(chordIntervals, chord.inversion)
      
      const chordNotes = invertedIntervals.map(interval => {
        const noteIndex = NOTES.indexOf(chord.note)
        const newIndex = (noteIndex + interval) % 12
        return `${NOTES[newIndex]}${chord.octave + Math.floor((noteIndex + interval) / 12)}`
      })

      if (sampler) {
        sampler.triggerAttack(chordNotes)
      }

      // Wait for the chord duration
      await new Promise(resolve => setTimeout(resolve, chordDuration))

      // Stop the chord
      if (sampler) {
        sampler.triggerRelease(chordNotes)
      }

      // Small pause between chords
      await new Promise(resolve => setTimeout(resolve, 200))
    }

    setIsPlayingBack(false)
    setCurrentlyPlayingIndex(-1)
  }

  // Clear recorded sequence
  const clearRecording = () => {
    setRecordedChords([])
  }

  // Calculate key position based on global index
  const getKeyPosition = (key: PianoKey): { left: string; zIndex: number } => {
    // Calculate position based on the actual piano layout
    const noteIndex = NOTES.indexOf(key.note)
    const octaveOffset = (key.octave - (OCTAVES[0] + octaveShift)) * 7 // 7 white keys per octave
    const whiteKeyIndex = getWhiteKeyIndex(noteIndex) + octaveOffset
    
    if (key.isBlack) {
      // Black keys are positioned between specific white keys
      const blackKeyOffset = getBlackKeyOffset(noteIndex)
      const leftPosition = (whiteKeyIndex * (100 / (OCTAVES.length * 7))) + blackKeyOffset
      return { left: `${leftPosition}%`, zIndex: 2 }
    } else {
      // White keys take full width
      const leftPosition = whiteKeyIndex * (100 / (OCTAVES.length * 7))
      return { left: `${leftPosition}%`, zIndex: 1 }
    }
  }

  // Get the white key index for a given note
  const getWhiteKeyIndex = (noteIndex: number): number => {
    const whiteKeyMap = [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6] // Maps note index to white key index
    return whiteKeyMap[noteIndex]
  }

  // Get the offset for black keys (positioned between white keys)
  const getBlackKeyOffset = (noteIndex: number): number => {
    const blackKeyOffsets = [0, 0.8, 0, 0.8, 0, 0, 0.8, 0, 0.8, 0, 0.8, 0] // Offset as percentage of white key width
    return blackKeyOffsets[noteIndex] * (100 / (OCTAVES.length * 7)) * 0.8
  }

  // Calculate key width based on type
  const getKeyWidth = (key: PianoKey): string => {
    const totalWhiteKeys = OCTAVES.length * 7 // 2 octaves * 7 white keys = 14
    const whiteKeyWidth = 100 / totalWhiteKeys // Each white key takes equal width
    
    if (key.isBlack) {
      return `${whiteKeyWidth * 0.4}%` // Black keys are 40% of white key width
    } else {
      return `${whiteKeyWidth}%`
    }
  }

  // Handle keyboard events
  useEffect(() => {
    let temporaryInversion: number | null = null
    let temporaryChordType: keyof typeof CHORD_TYPES | null = null
    let activeChords: Map<string, { inversion: number; chordType: keyof typeof CHORD_TYPES }> = new Map()
    
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
          playNote(note, octave)
        } else {
          // Use temporary inversion and chord type if available, otherwise use selected ones
          const currentInversion = temporaryInversion !== null ? temporaryInversion : selectedInversion
          const currentChordType = temporaryChordType !== null ? temporaryChordType : selectedChordType
          playChordWithInversionAndType(note, octave, currentInversion, currentChordType)
          // Track which inversion and chord type were used for this chord
          activeChords.set(`${note}${octave}`, { inversion: currentInversion, chordType: currentChordType })
          // Add to recording if recording is active
          const keyData = { note, octave, isBlack: note.includes('#') } as PianoKey
          addChordToRecording(keyData)
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
          stopNote(note, octave)
        } else {
          // Get the inversion and chord type that were used to play this chord
          const chordKey = `${note}${octave}`
          const chordData = activeChords.get(chordKey)
          const inversionUsed = chordData?.inversion ?? selectedInversion
          const chordTypeUsed = chordData?.chordType ?? selectedChordType
          stopChordWithInversionAndType(note, octave, inversionUsed, chordTypeUsed)
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
  }, [playMode, octaveShift, selectedChordType, selectedInversion, isRecording, sampler])

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
              onChange={(e) => setPlayMode(e.target.value as keyof typeof PLAY_MODES)}
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
                    setSelectedChordType(e.target.value as keyof typeof CHORD_TYPES)
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
                  {Array.from({ length: getMaxInversions() + 1 }, (_, i) => (
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
            return (
              <div
                key={`${key.note}-${key.octave}`}
                className={`piano-key ${key.isBlack ? 'black' : 'white'}`}
                onMouseDown={() => handleKeyPress(key)}
                onMouseUp={() => handleKeyRelease(key)}
                onMouseLeave={() => handleKeyRelease(key)}
                style={{
                  left: position.left,
                  zIndex: position.zIndex,
                  width: getKeyWidth(key)
                }}
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
            <p>Intervals: {applyInversion(CHORD_TYPES[selectedChordType], selectedInversion).join(', ')}</p>
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

// Helper function to get ordinal suffix
function getOrdinalSuffix(num: number): string {
  const j = num % 10
  const k = num % 100
  if (j === 1 && k !== 11) {
    return 'st'
  }
  if (j === 2 && k !== 12) {
    return 'nd'
  }
  if (j === 3 && k !== 13) {
    return 'rd'
  }
  return 'th'
}

// Helper function to abbreviate chord types
function abbreviateChordType(chordType: keyof typeof CHORD_TYPES): string {
  const abbreviations: Record<keyof typeof CHORD_TYPES, string> = {
    major: 'maj',
    minor: 'min',
    diminished: 'dim',
    augmented: 'aug',
    major7: 'maj7',
    minor7: 'min7',
    dominant7: 'dom7',
    diminished7: 'dim7'
  }
  return abbreviations[chordType]
}

export default App
