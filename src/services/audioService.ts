import { CHORD_TYPES, type ChordType } from '../constants/music'
import { applyInversion, generateChordNotes } from '../utils/music'

export class AudioService {
  private sampler: any

  constructor(sampler: any) {
    this.sampler = sampler
  }

  async playNote(note: string, octave: number) {
    if (!this.sampler) return

    const noteString = `${note}${octave}`
    await this.startAudioContext()
    this.sampler.triggerAttack(noteString)
  }

  stopNote(note: string, octave: number) {
    if (!this.sampler) return
    const noteString = `${note}${octave}`
    this.sampler.triggerRelease(noteString)
  }

  async playChord(rootNote: string, octave: number, chordType: ChordType, inversion: number = 0) {
    if (!this.sampler) return

    await this.startAudioContext()
    const chordIntervals = [...CHORD_TYPES[chordType]]
    const invertedIntervals = applyInversion(chordIntervals, inversion)
    const chordNotes = generateChordNotes(rootNote, invertedIntervals, octave)
    
    this.sampler.triggerAttack(chordNotes)
  }

  stopChord(rootNote: string, octave: number, chordType: ChordType, inversion: number = 0) {
    if (!this.sampler) return
    
    const chordIntervals = [...CHORD_TYPES[chordType]]
    const invertedIntervals = applyInversion(chordIntervals, inversion)
    const chordNotes = generateChordNotes(rootNote, invertedIntervals, octave)
    
    // Stop each note in the chord
    chordNotes.forEach(sampleString => {
      this.sampler.triggerRelease(sampleString)
    })
  }

  private async startAudioContext() {
    if (this.sampler.context.state !== 'running') {
      await this.sampler.context.start()
    }
  }
} 