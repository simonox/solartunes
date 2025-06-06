import { NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

export async function POST() {
  try {
    console.log("Stopping audio playback...")

    // Method 1: Kill all aplay processes more aggressively
    try {
      // First, get all aplay PIDs
      const { stdout: pgrepOutput } = await execAsync("pgrep -f 'aplay.*\\.wav' || echo ''")
      if (pgrepOutput.trim()) {
        const pids = pgrepOutput
          .trim()
          .split("\n")
          .filter((pid) => pid.trim())
        console.log(`Found aplay PIDs to kill: ${pids.join(", ")}`)

        // Kill each PID individually with escalating force
        for (const pid of pids) {
          try {
            // First try SIGTERM
            await execAsync(`kill -TERM ${pid}`)
            console.log(`Sent SIGTERM to PID ${pid}`)

            // Wait a moment
            await new Promise((resolve) => setTimeout(resolve, 500))

            // Check if still running
            try {
              await execAsync(`kill -0 ${pid}`)
              // Still running, force kill
              await execAsync(`kill -KILL ${pid}`)
              console.log(`Force killed PID ${pid}`)
            } catch (error) {
              // Process already dead, good
              console.log(`PID ${pid} already terminated`)
            }
          } catch (error) {
            console.log(`Failed to kill PID ${pid}:`, error)
          }
        }
      } else {
        console.log("No aplay processes found to kill")
      }
    } catch (error) {
      console.log("PID-based killing failed:", error)
    }

    // Method 2: Use pkill as backup
    try {
      await execAsync("pkill -KILL -f 'aplay.*\\.wav'")
      console.log("Used pkill to force kill aplay processes")
    } catch (error) {
      console.log("pkill method failed (normal if no processes):", error)
    }

    // Method 3: Try killall as final backup
    try {
      await execAsync("killall -KILL aplay")
      console.log("Used killall to kill aplay processes")
    } catch (error) {
      console.log("killall method failed (normal if no processes):", error)
    }

    // Method 4: Reset ALSA if needed
    try {
      // Check if ALSA is still showing as running
      const { stdout: alsaStatus } = await execAsync("cat /proc/asound/card*/pcm*/sub*/status 2>/dev/null || echo ''")
      if (alsaStatus.includes("state: RUNNING")) {
        console.log("ALSA still showing as running, attempting reset...")

        // Try to reset the audio device
        await execAsync("amixer -c 0 sset 'Master' mute 2>/dev/null || true")
        await new Promise((resolve) => setTimeout(resolve, 200))
        await execAsync("amixer -c 0 sset 'Master' unmute 2>/dev/null || true")

        console.log("Attempted ALSA reset")
      }
    } catch (error) {
      console.log("ALSA reset failed:", error)
    }

    // Wait a moment for cleanup
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Final verification
    try {
      const { stdout: finalCheck } = await execAsync("pgrep -f 'aplay.*\\.wav' || echo ''")
      if (finalCheck.trim()) {
        console.log(`Warning: Some aplay processes may still be running: ${finalCheck.trim()}`)
      } else {
        console.log("All aplay processes successfully terminated")
      }
    } catch (error) {
      console.log("Final verification failed:", error)
    }

    return NextResponse.json({
      success: true,
      message: "Playback stopped and processes cleaned up",
    })
  } catch (error) {
    console.error("Error stopping playback:", error)
    return NextResponse.json(
      {
        error: "Failed to stop playback",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
