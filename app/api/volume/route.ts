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

    console.log(`Setting volume to ${volume}% on HiFiBerry DAC+`)

    // HiFiBerry DAC+ uses different volume controls
    const commands = [
      // Try Digital Playback Volume (most common for HiFiBerry DAC+)
      `amixer -c 0 sset 'Digital Playback Volume' ${volume}%`,
      // Try Analogue Playback Volume
      `amixer -c 0 sset 'Analogue Playback Volume' ${volume}%`,
      // Try PCM if available
      `amixer -c 0 sset 'PCM' ${volume}%`,
    ]

    let success = false
    let lastError = ""

    for (const command of commands) {
      try {
        console.log(`Trying command: ${command}`)
        await execAsync(command)
        console.log(`Successfully set volume with: ${command}`)
        success = true
        break
      } catch (error) {
        lastError = error instanceof Error ? error.message : "Unknown error"
        console.log(`Failed command: ${command}, error: ${lastError}`)
        continue
      }
    }

    if (!success) {
      // Get available controls for debugging
      try {
        const { stdout: controls } = await execAsync("amixer -c 0 controls")
        console.log("Available HiFiBerry DAC+ controls:", controls)

        return NextResponse.json(
          {
            error: "Failed to set volume with any HiFiBerry DAC+ method",
            details: lastError,
            availableControls: controls.split("\n").slice(0, 10),
            suggestion: "HiFiBerry DAC+ may not support software volume control",
          },
          { status: 500 },
        )
      } catch {
        return NextResponse.json(
          {
            error: "Failed to set volume and couldn't get available controls",
            details: lastError,
            suggestion: "HiFiBerry DAC+ may use hardware volume control only",
          },
          { status: 500 },
        )
      }
    }

    return NextResponse.json({ success: true, volume })
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
    // Try to get current volume level from HiFiBerry DAC+ controls
    const commands = [
      "amixer -c 0 sget 'Digital Playback Volume'",
      "amixer -c 0 sget 'Analogue Playback Volume'",
      "amixer -c 0 sget 'PCM'",
    ]

    for (const command of commands) {
      try {
        console.log(`Trying to get volume with: ${command}`)
        const { stdout } = await execAsync(command)

        // Parse the output to extract volume percentage
        const volumeMatch = stdout.match(/\[(\d+)%\]/)
        if (volumeMatch) {
          const volume = Number.parseInt(volumeMatch[1])
          console.log(`Got volume ${volume}% from HiFiBerry DAC+`)
          return NextResponse.json({ volume })
        }

        // Try to parse absolute values if percentage not found
        const absoluteMatch = stdout.match(/\[(\d+)\/(\d+)\]/)
        if (absoluteMatch) {
          const current = Number.parseInt(absoluteMatch[1])
          const max = Number.parseInt(absoluteMatch[2])
          const volume = Math.round((current / max) * 100)
          console.log(`Got volume ${volume}% (${current}/${max}) from HiFiBerry DAC+`)
          return NextResponse.json({ volume })
        }
      } catch (error) {
        console.log(`Failed to get volume with: ${command}`)
        continue
      }
    }

    // If all methods fail, return default volume
    console.log("Could not get volume from HiFiBerry DAC+, using default")
    return NextResponse.json({
      volume: 75, // Default volume for HiFiBerry DAC+
      note: "HiFiBerry DAC+ may not support software volume control",
    })
  } catch (error) {
    console.error("Error getting volume:", error)
    return NextResponse.json({ volume: 75 }) // Default volume
  }
}
