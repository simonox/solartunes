import { NextResponse } from "next/server"
import { exec, spawn } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

export async function POST() {
  try {
    console.log("Stopping audio playback...")

    // Method 1: Kill all aplay processes using pkill
    try {
      spawn("pkill", ["-TERM", "-f", "aplay"], { stdio: "ignore" })
      console.log("Sent SIGTERM to aplay processes")

      // Wait a moment, then force kill if needed
      setTimeout(() => {
        spawn("pkill", ["-KILL", "-f", "aplay"], { stdio: "ignore" })
      }, 1000)
    } catch (error) {
      console.log("pkill method failed, trying killall...")

      // Method 2: Try killall as fallback
      try {
        await execAsync("killall -TERM aplay")
        console.log("Used killall to stop aplay processes")
      } catch (killallError) {
        console.log("killall also failed, processes may have already stopped")
      }
    }

    // Method 3: Also try to stop any audio that might be playing through ALSA
    try {
      await execAsync("amixer -c 0 sset 'Master' mute")
      setTimeout(async () => {
        try {
          await execAsync("amixer -c 0 sset 'Master' unmute")
        } catch (error) {
          console.log("Could not unmute after stop")
        }
      }, 500)
    } catch (error) {
      console.log("Could not mute/unmute audio device")
    }

    return NextResponse.json({ success: true, message: "Playback stopped" })
  } catch (error) {
    console.error("Error stopping playback:", error)
    return NextResponse.json({ error: "Failed to stop playback" }, { status: 500 })
  }
}
