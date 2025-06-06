import { NextResponse } from "next/server"

// In-memory storage for motion detection settings
const motionSettings = {
  enabled: false,
  selectedFile: null as string | null,
  lastMotionTime: null as string | null,
  motionCount: 0,
}

export async function GET() {
  try {
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
    } else if (body.action === "setFile") {
      motionSettings.selectedFile = body.fileName || null
      console.log(`Motion detection file set to: ${body.fileName || "none"}`)
    } else if (body.action === "triggerMotion") {
      // Simulate motion detection for testing
      motionSettings.lastMotionTime = new Date().toISOString()
      motionSettings.motionCount++
      console.log(`Motion detected! Count: ${motionSettings.motionCount}`)

      // If motion detection is enabled and a file is selected, trigger playback
      if (motionSettings.enabled && motionSettings.selectedFile) {
        try {
          // First check if something is already playing
          const statusResponse = await fetch(
            `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/status`,
          )
          const statusData = await statusResponse.json()

          if (statusData.playing) {
            console.log("Motion detected but audio is already playing - ignoring trigger")
            return NextResponse.json({
              success: true,
              ...motionSettings,
              message: "Motion detected but audio already playing",
            })
          }

          const playResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/play`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fileName: motionSettings.selectedFile }),
          })

          if (playResponse.ok) {
            console.log(`Motion triggered playback of: ${motionSettings.selectedFile}`)
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
