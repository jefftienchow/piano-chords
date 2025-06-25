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

function App() {
  const [synth, setSynth] = useState<Tone.PolySynth | null>(null)
  const [selectedChordType, setSelectedChordType] = useState<keyof typeof CHORD_TYPES>('major')
  const [selectedInversion, setSelectedInversion] = useState<number>(0)
  const [playMode, setPlayMode] = useState<keyof typeof PLAY_MODES>('chord')
  const [isPlaying, setIsPlaying] = useState(false)

  // Initialize audio context and synthesizer
  useEffect(() => {
    const newSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: {
        type: 'triangle'
      },
      envelope: {
        attack: 0.05,
        decay: 1,
        sustain: 0.1,
        release: 1
      }
    }).toDestination()

    setSynth(newSynth)

    return () => {
      newSynth.dispose()
    }
  }, [])

  // Generate piano keys
  const generatePianoKeys = (): PianoKey[] => {
    const keys: PianoKey[] = []
    let globalIndex = 0
    
    OCTAVES.forEach(octave => {
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
    if (!synth) return

    // Start audio context if not already started
    if (Tone.context.state !== 'running') {
      await Tone.start()
    }

    const noteString = `${note}${octave}`
    synth.triggerAttack(noteString)
  }

  // Stop note function
  const stopNote = (note: string, octave: number) => {
    if (!synth) return
    const noteString = `${note}${octave}`
    synth.triggerRelease(noteString)
  }

  // Play chord function
  const playChord = async (rootNote: string, octave: number) => {
    if (!synth) return

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

    synth.triggerAttack(chordNotes)
  }

  // Stop chord function
  const stopChord = (rootNote: string, octave: number) => {
    if (!synth) return
    
    const chordIntervals = CHORD_TYPES[selectedChordType]
    const invertedIntervals = applyInversion(chordIntervals, selectedInversion)
    
    const chordNotes = invertedIntervals.map(interval => {
      const noteIndex = NOTES.indexOf(rootNote)
      const newIndex = (noteIndex + interval) % 12
      return `${NOTES[newIndex]}${octave + Math.floor((noteIndex + interval) / 12)}`
    })

    synth.triggerRelease(chordNotes)
  }

  // Handle key press (mouse down)
  const handleKeyPress = (key: PianoKey) => {
    if (playMode === 'note') {
      playNote(key.note, key.octave)
    } else {
      playChord(key.note, key.octave)
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

  // Calculate key position based on global index
  const getKeyPosition = (key: PianoKey): { left: string; zIndex: number } => {
    // Calculate position based on the actual piano layout
    const noteIndex = NOTES.indexOf(key.note)
    const octaveOffset = (key.octave - OCTAVES[0]) * 7 // 7 white keys per octave
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
                  width: key.isBlack ? '4%' : '14.28%' // 7 white keys per octave = 14.28% each
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

export default App
