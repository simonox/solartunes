import { NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

export async function POST() {
  try {
    console.log("Performing aggressive audio cleanup...")

    const cleanupResults: string[] = []

    // 1. Kill all audio processes
    try {
      await execAsync("pkill -KILL -f 'aplay|mpg123|vlc|mplayer'")
      cleanupResults.push("Killed all audio processes")
    } catch (error) {
      cleanupResults.push("No audio processes to kill")
    }

    // 2. Reset ALSA
    try {
      await execAsync("alsactl restore")
      cleanupResults.push("ALSA configuration restored")
    } catch (error) {
      cleanupResults.push("ALSA restore failed (may not be available)")
    }

    // 3. Reload audio modules (if possible)
    try {
      await execAsync("sudo modprobe -r snd_pcm && sudo modprobe snd_pcm")
      cleanupResults.push("Audio modules reloaded")
    } catch (error) {
      cleanupResults.push("Module reload failed (requires sudo)")
    }

    // 4. Clear any stuck ALSA states
    try {
      await execAsync("amixer -c 0 sset 'Master' 0% && amixer -c 0 sset 'Master' 50%")
      cleanupResults.push("ALSA mixer reset")
    } catch (error) {
      cleanupResults.push("Mixer reset failed")
    }

    // 5. Final status check
    const { stdout: finalStatus } = await execAsync("pgrep -f aplay || echo 'No aplay processes'")
    cleanupResults.push(`Final check: ${finalStatus.trim()}`)

    return NextResponse.json({
      success: true,
      message: "Aggressive cleanup completed",
      results: cleanupResults,
    })
  } catch (error) {
    console.error("Cleanup error:", error)
    return NextResponse.json(
      {
        error: "Cleanup failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
