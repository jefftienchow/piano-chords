import { useState, useEffect } from 'react'
import * as Tone from 'tone'
import { AVAILABLE_SAMPLES } from '../constants/music'

export const useAudioSampler = () => {
  const [sampler, setSampler] = useState<Tone.Sampler | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // Create sample URLs for only the available notes
    const sampleUrls: Record<string, string> = {}
    
    // Available notes from the sample set
    for (let octave = 0; octave <= 8; octave++) {
      AVAILABLE_SAMPLES.forEach(note => {
        const noteName = `${note}${octave}`
        sampleUrls[noteName] = `${note.replace('#', 'sharp')}${octave}v4.wav`
      })
    }

    const newSampler = new Tone.Sampler({
      urls: sampleUrls,
      baseUrl: "/samples/",
      release: 1,
      onload: () => {
        console.log("Samples loaded")
        setIsLoaded(true)
      }
    }).toDestination()

    setSampler(newSampler)

    return () => {
      newSampler.dispose()
    }
  }, [])

  const startAudioContext = async () => {
    if (Tone.context.state !== 'running') {
      await Tone.start()
    }
  }

  const playNotes = async (notes: string[]) => {
    if (!sampler) return
    await startAudioContext()
    sampler.triggerAttack(notes)
  }

  const stopNotes = (notes: string[]) => {
    if (!sampler) return
    notes.forEach(note => {
      sampler.triggerRelease(note)
    })
  }

  return {
    sampler,
    isLoaded,
    playNotes,
    stopNotes,
    startAudioContext
  }
} 