import { NextResponse } from "next/server"

export async function GET() {
  try {
    // For preview purposes, randomly simulate playing/not playing
    const playing = Math.random() > 0.7 // 30% chance of something playing

    return NextResponse.json({ playing })
  } catch (error) {
    console.error("Error checking status:", error)
    return NextResponse.json({ playing: false })
  }
}
