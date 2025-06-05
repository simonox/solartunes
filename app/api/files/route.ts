import { NextResponse } from "next/server"

export async function GET() {
  try {
    // For preview purposes, return fake .wav files
    const fakeFiles = [
      {
        name: "ambient-forest.wav",
        path: "/home/pi/Music/ambient-forest.wav",
      },
      {
        name: "ocean-waves.wav",
        path: "/home/pi/Music/ocean-waves.wav",
      },
      {
        name: "bird-songs.wav",
        path: "/home/pi/Music/bird-songs.wav",
      },
      {
        name: "rain-sounds.wav",
        path: "/home/pi/Music/rain-sounds.wav",
      },
      {
        name: "wind-chimes.wav",
        path: "/home/pi/Music/wind-chimes.wav",
      },
      {
        name: "test-tone.wav",
        path: "/home/pi/Music/test-tone.wav",
      },
      {
        name: "frequency-sweep.wav",
        path: "/home/pi/Music/frequency-sweep.wav",
      },
      {
        name: "chord.wav",
        path: "/home/pi/Music/chord.wav",
      },
    ]

    console.log(`Found ${fakeFiles.length} .wav files in Music directory`)
    return NextResponse.json({ files: fakeFiles })
  } catch (error) {
    console.error("Error listing files:", error)
    return NextResponse.json({
      files: [],
      error: "Failed to list files",
      details: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
