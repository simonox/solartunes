import { NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

export async function POST(request: Request) {
  try {
    const { volume } = await request.json()

    if (volume === undefined || volume < 0 || volume > 100) {
      return NextResponse.json({ error: "Invalid volume level. Must be between 0 and 100." }, { status: 400 })
    }

    console.log(`Setting volume to ${volume}%`)

    // Use amixer to set the volume
    try {
      // Set Master volume
      await execAsync(`amixer set Master ${volume}% unmute`)

      // Also try to set PCM if it exists (common on Raspberry Pi)
      try {
        await execAsync(`amixer set PCM ${volume}% unmute`)
      } catch {
        // PCM might not exist, which is fine
      }

      return NextResponse.json({ success: true, volume })
    } catch (error) {
      console.error("Error setting volume:", error)
      return NextResponse.json(
        {
          error: "Failed to set volume",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error processing volume request:", error)
    return NextResponse.json(
      {
        error: "Failed to process volume request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  try {
    // Get current volume level
    const { stdout } = await execAsync("amixer get Master")

    // Parse the output to extract volume percentage
    const volumeMatch = stdout.match(/\[(\d+)%\]/)
    const volume = volumeMatch ? Number.parseInt(volumeMatch[1]) : 50

    return NextResponse.json({ volume })
  } catch (error) {
    console.error("Error getting volume:", error)
    // Return a default volume if we can't get the actual volume
    return NextResponse.json({ volume: 50 })
  }
}
