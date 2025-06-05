import { NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

export async function POST() {
  try {
    console.log("Stopping audio playback...")

    // Kill all aplay processes
    try {
      await execAsync("pkill -f aplay")
      console.log("Stopped aplay processes")
    } catch (error) {
      // pkill returns non-zero exit code if no processes found, which is fine
      console.log("No aplay processes to stop")
    }

    return NextResponse.json({ success: true, message: "Playback stopped" })
  } catch (error) {
    console.error("Error stopping playback:", error)
    return NextResponse.json({ error: "Failed to stop playback" }, { status: 500 })
  }
}
