import { NextResponse } from "next/server"
import { exec } from "child_process"

export async function POST() {
  try {
    // Kill all aplay processes
    exec("pkill -f aplay", (error) => {
      if (error && error.code !== 1) {
        console.error("Error stopping playback:", error)
      }
    })

    return NextResponse.json({ success: true, message: "Playback stopped" })
  } catch (error) {
    console.error("Error stopping playback:", error)
    return NextResponse.json({ error: "Failed to stop playback" }, { status: 500 })
  }
}
