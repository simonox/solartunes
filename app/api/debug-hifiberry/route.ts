import { NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

export async function GET() {
  try {
    const debugInfo: any = {
      device: "HiFiBerry DAC+",
      timestamp: new Date().toISOString(),
    }

    // Check HiFiBerry driver
    try {
      const { stdout: lsmod } = await execAsync("lsmod | grep hifiberry")
      debugInfo.hifiberryDriver = lsmod || "HiFiBerry driver not loaded"
    } catch (error) {
      debugInfo.hifiberryDriverError = "HiFiBerry driver not found"
    }

    // Check audio card
    try {
      const { stdout: cardInfo } = await execAsync("cat /proc/asound/card0/id")
      debugInfo.audioCard = cardInfo.trim()
    } catch (error) {
      debugInfo.audioCardError = "Could not read audio card info"
    }

    // Check available controls
    try {
      const { stdout: controls } = await execAsync("amixer -c 0 controls")
      debugInfo.availableControls = controls.split("\n").slice(0, 20) // First 20 controls
    } catch (error) {
      debugInfo.controlsError = error instanceof Error ? error.message : "Unknown error"
    }

    // Check current volume settings
    const volumeControls = ["Digital Playback Volume", "Analogue Playback Volume", "PCM"]
    debugInfo.volumeStatus = {}

    for (const control of volumeControls) {
      try {
        const { stdout } = await execAsync(`amixer -c 0 sget '${control}'`)
        debugInfo.volumeStatus[control] = stdout
      } catch (error) {
        debugInfo.volumeStatus[control] = "Not available"
      }
    }

    // Check PCM capabilities
    try {
      const { stdout: pcmInfo } = await execAsync("cat /proc/asound/card0/pcm0p/info")
      debugInfo.pcmCapabilities = pcmInfo
    } catch (error) {
      debugInfo.pcmError = "Could not read PCM info"
    }

    // Check if HiFiBerry is configured in boot config
    try {
      const { stdout: bootConfig } = await execAsync("grep -i hifiberry /boot/config.txt")
      debugInfo.bootConfiguration = bootConfig || "No HiFiBerry configuration found in /boot/config.txt"
    } catch (error) {
      debugInfo.bootConfigError = "Could not read /boot/config.txt"
    }

    // Check running audio processes
    try {
      const { stdout: processes } = await execAsync("ps aux | grep -E 'aplay|pulseaudio|alsa' | grep -v grep")
      debugInfo.audioProcesses = processes || "No audio processes found"
    } catch (error) {
      debugInfo.audioProcesses = "No audio processes found"
    }

    return NextResponse.json(debugInfo)
  } catch (error) {
    console.error("Error getting HiFiBerry debug info:", error)
    return NextResponse.json({
      error: "Failed to get HiFiBerry debug info",
      details: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
