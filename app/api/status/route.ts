import { NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

export async function GET() {
  try {
    // Check if aplay is running using multiple methods
    let isPlaying = false
    let processInfo = ""

    // Method 1: Check with pgrep
    try {
      const { stdout } = await execAsync("pgrep -f aplay")
      if (stdout.trim()) {
        isPlaying = true
        processInfo = `PIDs: ${stdout.trim().replace(/\n/g, ", ")}`
      }
    } catch {
      // pgrep returns non-zero exit code if no processes found
    }

    // Method 2: Check with ps if pgrep didn't find anything
    if (!isPlaying) {
      try {
        const { stdout } = await execAsync("ps aux | grep aplay | grep -v grep")
        if (stdout.trim()) {
          isPlaying = true
          processInfo = "Found via ps command"
        }
      } catch {
        // No processes found
      }
    }

    // Method 3: Check ALSA playback status
    let alsaInfo = ""
    try {
      const { stdout } = await execAsync(
        "cat /proc/asound/card*/pcm*/sub*/status 2>/dev/null | grep -E 'state|owner_pid' || echo 'No ALSA status'",
      )
      alsaInfo = stdout.trim()
    } catch {
      alsaInfo = "Could not read ALSA status"
    }

    return NextResponse.json({
      playing: isPlaying,
      processInfo,
      alsaInfo,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error checking status:", error)
    return NextResponse.json({
      playing: false,
      error: "Status check failed",
      timestamp: new Date().toISOString(),
    })
  }
}
