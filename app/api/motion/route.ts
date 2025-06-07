import { NextResponse } from "next/server"
import { readFile, writeFile } from "fs/promises"
import { join } from "path"
import { homedir } from "os"

// Configuration file path
const CONFIG_FILE = join(homedir(), "Music", "autoplay.conf")

// In-memory storage for motion detection settings
const motionSettings = {
  enabled: false,
  selectedFile: null as string | null,
  lastMotionTime: null as string | null,
  motionCount: 0,
  currentlyPlaying: null as string | null, // Track what's playing via motion
}

// Load configuration from file
async function loadConfig() {
  try {
    const configData = await readFile(CONFIG_FILE, "utf-8")
    const config = JSON.parse(configData)

    // Restore settings from config
    if (config.selectedFile) {
      motionSettings.selectedFile = config.selectedFile
    }
    if (config.enabled !== undefined) {
      motionSettings.enabled = config.enabled
    }

    console.log("Motion configuration loaded:", config)
  } catch (error) {
    // Config file doesn't exist or is invalid, use defaults
    console.log("No motion configuration found, using defaults")
  }
}

// Save configuration to file
async function saveConfig() {
  try {
    const config = {
      enabled: motionSettings.enabled,
      selectedFile: motionSettings.selectedFile,
      lastSaved: new Date().toISOString(),
    }

    await writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), "utf-8")
    console.log("Motion configuration saved:", config)
  } catch (error) {
    console.error("Failed to save motion configuration:", error)
  }
}

// Initialize configuration on module load
loadConfig()

export async function GET() {
  try {
    // Ensure config is loaded
    await loadConfig()

    return NextResponse.json({
      ...motionSettings,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error getting motion status:", error)
    return NextResponse.json(
      {
        error: "Failed to get motion status",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (body.action === "toggle") {
      motionSettings.enabled = !motionSettings.enabled
      console.log(`Motion detection ${motionSettings.enabled ? "enabled" : "disabled"}`)
      await saveConfig()
    } else if (body.action === "setFile") {
      motionSettings.selectedFile = body.fileName || null
      console.log(`Motion detection file set to: ${body.fileName || "none"}`)
      await saveConfig()
    } else if (body.action === "triggerMotion") {
      // Simulate motion detection for testing
      motionSettings.lastMotionTime = new Date().toISOString()
      motionSettings.motionCount++
      console.log(`Motion detected! Count: ${motionSettings.motionCount}`)

      // If motion detection is enabled and a file is selected, trigger playback
      if (motionSettings.enabled && motionSettings.selectedFile) {
        try {
          // Import the status checking logic directly instead of making HTTP calls
          const { exec } = await import("child_process")
          const { promisify } = await import("util")
          const execAsync = promisify(exec)

          // Check if aplay is currently running
          let isPlaying = false
          try {
            const { stdout } = await execAsync("pgrep aplay")
            isPlaying = stdout.trim().length > 0
          } catch (error) {
            // pgrep returns non-zero exit code when no processes found, which is fine
            isPlaying = false
          }

          if (isPlaying) {
            console.log("Motion detected but audio is already playing - ignoring trigger")
            return NextResponse.json({
              success: true,
              ...motionSettings,
              message: "Motion detected but audio already playing",
            })
          }

          // Trigger playback by calling the play API
          const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
          const playResponse = await fetch(`${baseUrl}/api/play`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fileName: motionSettings.selectedFile }),
          })

          if (playResponse.ok) {
            console.log(`Motion triggered playback of: ${motionSettings.selectedFile}`)
            // Set the currently playing file in motion settings
            motionSettings.currentlyPlaying = motionSettings.selectedFile
          } else {
            console.error("Failed to trigger motion playback via API")
          }
        } catch (playError) {
          console.error("Failed to trigger motion playback:", playError)
        }
      }
    }

    return NextResponse.json({
      success: true,
      ...motionSettings,
    })
  } catch (error) {
    console.error("Error updating motion settings:", error)
    return NextResponse.json(
      {
        error: "Failed to update motion settings",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
