import { NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

export async function GET() {
  try {
    let isPlaying = false
    let processInfo = ""
    const debugInfo: string[] = []

    // Method 1: Check with pgrep for aplay processes
    try {
      const { stdout: pgrepOutput } = await execAsync("pgrep -f 'aplay.*\\.wav'")
      if (pgrepOutput.trim()) {
        isPlaying = true
        processInfo = `PIDs: ${pgrepOutput.trim().replace(/\n/g, ", ")}`
        debugInfo.push(`pgrep found: ${pgrepOutput.trim()}`)
      } else {
        debugInfo.push("pgrep found no aplay processes")
      }
    } catch (error) {
      debugInfo.push("pgrep returned no processes (normal if nothing playing)")
    }

    // Method 2: Check with ps if pgrep didn't find anything
    if (!isPlaying) {
      try {
        const { stdout: psOutput } = await execAsync("ps aux | grep 'aplay.*\\.wav' | grep -v grep")
        if (psOutput.trim()) {
          isPlaying = true
          processInfo = "Found via ps command"
          debugInfo.push(`ps found: ${psOutput.trim().split("\n").length} processes`)
        } else {
          debugInfo.push("ps found no aplay processes")
        }
      } catch (error) {
        debugInfo.push("ps check failed")
      }
    }

    // Method 3: Check ALSA playback status
    let alsaInfo = ""
    try {
      const { stdout: alsaOutput } = await execAsync(
        "cat /proc/asound/card*/pcm*/sub*/status 2>/dev/null || echo 'No ALSA status'",
      )
      alsaInfo = alsaOutput.trim()

      // Check if ALSA shows active playback
      if (alsaInfo.includes("state: RUNNING")) {
        if (!isPlaying) {
          isPlaying = true
          processInfo = "ALSA shows active playback"
        }
        debugInfo.push("ALSA state: RUNNING")
      } else {
        debugInfo.push("ALSA state: not running")
      }
    } catch (error) {
      alsaInfo = "Could not read ALSA status"
      debugInfo.push("ALSA check failed")
    }

    // Method 4: Check for any audio-related processes
    if (!isPlaying) {
      try {
        const { stdout: audioProcesses } = await execAsync("pgrep -f 'aplay|mpg123|vlc|mplayer' || echo ''")
        if (audioProcesses.trim()) {
          debugInfo.push(`Other audio processes: ${audioProcesses.trim()}`)
        } else {
          debugInfo.push("No audio processes found")
        }
      } catch (error) {
        debugInfo.push("Audio process check failed")
      }
    }

    console.log(`Status check: playing=${isPlaying}, debug=${debugInfo.join(", ")}`)

    return NextResponse.json({
      playing: isPlaying,
      processInfo,
      alsaInfo,
      debugInfo,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error checking status:", error)
    return NextResponse.json({
      playing: false,
      error: "Status check failed",
      details: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    })
  }
}
