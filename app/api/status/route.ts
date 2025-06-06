import { NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

export async function GET() {
  try {
    let isPlaying = false
    let processInfo = ""
    const debugInfo: string[] = []

    // Method 1: Check with pgrep for aplay processes and verify they're actually running
    try {
      const { stdout: pgrepOutput } = await execAsync("pgrep -f 'aplay.*\\.wav'")
      if (pgrepOutput.trim()) {
        const pids = pgrepOutput.trim().split("\n")
        debugInfo.push(`pgrep found PIDs: ${pids.join(", ")}`)

        // Check if these processes are actually running (not zombies)
        const activePids: string[] = []
        for (const pid of pids) {
          try {
            const { stdout: psOutput } = await execAsync(`ps -p ${pid} -o state= 2>/dev/null || echo "DEAD"`)
            const state = psOutput.trim()
            debugInfo.push(`PID ${pid} state: ${state}`)

            // Only consider processes that are actually running (R, S, D states, not Z for zombie)
            if (state && !state.includes("Z") && state !== "DEAD") {
              activePids.push(pid)
            } else {
              debugInfo.push(`PID ${pid} is zombie/dead, ignoring`)
            }
          } catch (error) {
            debugInfo.push(`PID ${pid} check failed, assuming dead`)
          }
        }

        if (activePids.length > 0) {
          isPlaying = true
          processInfo = `Active PIDs: ${activePids.join(", ")}`
          debugInfo.push(`Found ${activePids.length} active aplay processes`)
        } else {
          debugInfo.push("All aplay processes are zombies/dead")
        }
      } else {
        debugInfo.push("pgrep found no aplay processes")
      }
    } catch (error) {
      debugInfo.push("pgrep returned no processes (normal if nothing playing)")
    }

    // Method 2: Check ALSA playback status - this is often more reliable
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

        // If ALSA shows not running but we found processes, they're likely stuck
        if (processInfo.includes("PIDs:")) {
          debugInfo.push("ALSA not running but processes found - likely stuck processes")
          isPlaying = false // Override - trust ALSA over process list
          processInfo = "Stuck processes detected, not actually playing"
        }
      }
    } catch (error) {
      alsaInfo = "Could not read ALSA status"
      debugInfo.push("ALSA check failed")
    }

    // Method 3: Double-check with lsof to see if any process has audio device open
    try {
      const { stdout: lsofOutput } = await execAsync("lsof /dev/snd/* 2>/dev/null || echo ''")
      if (lsofOutput.trim() && lsofOutput.includes("aplay")) {
        debugInfo.push("lsof shows aplay using audio device")
        if (!isPlaying) {
          isPlaying = true
          processInfo = "Audio device in use by aplay"
        }
      } else {
        debugInfo.push("lsof shows no aplay using audio device")
      }
    } catch (error) {
      debugInfo.push("lsof check failed")
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
