import { NextResponse } from "next/server"

export async function POST() {
  try {
    // For preview purposes, simulate stopping playback
    console.log("Simulating stop playback")

    return NextResponse.json({ success: true, message: "Playback stopped" })
  } catch (error) {
    console.error("Error stopping playback:", error)
    return NextResponse.json({ error: "Failed to stop playback" }, { status: 500 })
  }
}
