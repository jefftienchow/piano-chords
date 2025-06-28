# 🎹 Piano Chords - Interactive Chord Player

A beautiful, interactive web application for learning and playing piano chords. Built with React, TypeScript, and Tone.js for high-quality audio synthesis.

## Features

### 🎵 **Dual Play Modes**
- **Chord Mode**: Play various chord qualities (major, minor, diminished, augmented, 7th chords)
- **Single Note Mode**: Play individual piano notes

### 🎼 **Comprehensive Chord Library**
- **Triads**: Major, Minor, Diminished, Augmented
- **7th Chords**: Major 7, Minor 7, Dominant 7, Diminished 7
- **Inversions**: Root position, 1st, 2nd, and 3rd inversions
- **Dynamic Options**: Chord quality and inversion selectors update automatically

### 🎹 **Realistic Piano Interface**
- **2-Octave Range**: C4 to B5 (24 keys total)
- **Authentic Layout**: Proper white/black key positioning
- **Visual Feedback**: Hover and click animations
- **Responsive Design**: Works on desktop, tablet, and mobile

### 🔊 **High-Quality Audio**
- **Tone.js Synthesis**: Professional-grade audio engine
- **Custom Envelope**: Snappy, piano-like sound characteristics
- **Polyphonic**: Play multiple notes simultaneously

## Getting Started

### Prerequisites
- Node.js (version 16 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/piano-chords.git
   cd piano-chords
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

## How to Use

### Playing Chords
1. Select "Chord" mode from the Play Mode dropdown
2. Choose your desired chord quality (Major, Minor, etc.)
3. Select an inversion (Root Position, 1st Inversion, etc.)
4. Click any piano key to play the chord with that note as the root

### Playing Single Notes
1. Select "Single Note" mode from the Play Mode dropdown
2. Click any piano key to play that individual note

### Understanding the Interface
- **White Keys**: Natural notes (C, D, E, F, G, A, B)
- **Black Keys**: Sharp notes (C#, D#, F#, G#, A#)
- **Key Labels**: Show note name and octave (e.g., "C4", "D#5")
- **Info Panel**: Displays current settings and chord intervals

## Technical Details

### Built With
- **React 19** - Modern UI framework
- **TypeScript** - Type-safe JavaScript
- **Tone.js** - Web Audio framework
- **Vite** - Fast build tool
- **CSS3** - Modern styling with gradients and animations

### Architecture
- **Component-Based**: Modular, reusable components
- **State Management**: React hooks for local state
- **Audio Engine**: Tone.js PolySynth for chord playback
- **Responsive Design**: Mobile-first CSS approach

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- **Tone.js** for the excellent audio synthesis capabilities
- **React** team for the amazing framework
- **Vite** for the fast development experience

---

**Happy chord playing! 🎵**
