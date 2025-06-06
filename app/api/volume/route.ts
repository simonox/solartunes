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

    // Try different amixer commands in order of preference
    const commands = [
      // Try with card 0 explicitly
      `amixer -c 0 sset 'Master' ${volume}%`,
      `amixer -c 0 sset 'PCM' ${volume}%`,
      `amixer -c 0 sset 'Headphone' ${volume}%`,
      `amixer -c 0 sset 'Speaker' ${volume}%`,

      // Try without card specification
      `amixer sset 'Master' ${volume}%`,
      `amixer sset 'PCM' ${volume}%`,
      `amixer sset 'Headphone' ${volume}%`,
      `amixer sset 'Speaker' ${volume}%`,

      // Try with different syntax (no quotes)
      `amixer sset Master ${volume}%`,
      `amixer sset PCM ${volume}%`,

      // Try with absolute values instead of percentage
      `amixer sset Master ${Math.round((volume / 100) * 65536)}`,
      `amixer sset PCM ${Math.round((volume / 100) * 65536)}`,
    ]

    let lastError = ""
    let success = false

    for (const command of commands) {
      try {
        console.log(`Trying command: ${command}`)
        await execAsync(command)
        console.log(`Success with command: ${command}`)
        success = true
        break
      } catch (error) {
        lastError = error instanceof Error ? error.message : "Unknown error"
        console.log(`Failed command: ${command}, error: ${lastError}`)
        continue
      }
    }

    if (!success) {
      // Try to get available controls for debugging
      try {
        const { stdout: controls } = await execAsync("amixer controls")
        console.log("Available amixer controls:", controls)

        return NextResponse.json(
          {
            error: "Failed to set volume with any method",
            details: lastError,
            availableControls: controls.split("\n").slice(0, 10), // First 10 controls for debugging
          },
          { status: 500 },
        )
      } catch {
        return NextResponse.json(
          {
            error: "Failed to set volume and couldn't get available controls",
            details: lastError,
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
    // Try to get current volume level with different methods
    const commands = [
      "amixer -c 0 get Master",
      "amixer -c 0 get PCM",
      "amixer -c 0 get Headphone",
      "amixer -c 0 get Speaker",
      "amixer get Master",
      "amixer get PCM",
      "amixer get Headphone",
      "amixer get Speaker",
    ]

    for (const command of commands) {
      try {
        console.log(`Trying to get volume with: ${command}`)
        const { stdout } = await execAsync(command)

        // Parse the output to extract volume percentage
        const volumeMatch = stdout.match(/\[(\d+)%\]/)
        if (volumeMatch) {
          const volume = Number.parseInt(volumeMatch[1])
          console.log(`Got volume ${volume}% from command: ${command}`)
          return NextResponse.json({ volume })
        }

        // Try to parse absolute values if percentage not found
        const absoluteMatch = stdout.match(/\[(\d+)\/(\d+)\]/)
        if (absoluteMatch) {
          const current = Number.parseInt(absoluteMatch[1])
          const max = Number.parseInt(absoluteMatch[2])
          const volume = Math.round((current / max) * 100)
          console.log(`Got volume ${volume}% (${current}/${max}) from command: ${command}`)
          return NextResponse.json({ volume })
        }
      } catch (error) {
        console.log(`Failed to get volume with: ${command}`)
        continue
      }
    }

    // If all methods fail, try to get available controls for debugging
    try {
      const { stdout: controls } = await execAsync("amixer controls")
      console.log("Available amixer controls:", controls)

      return NextResponse.json({
        volume: 50, // Default volume
        error: "Could not get current volume",
        availableControls: controls.split("\n").slice(0, 10),
      })
    } catch {
      console.log("Could not get amixer controls")
      return NextResponse.json({ volume: 50 }) // Default volume
    }
  } catch (error) {
    console.error("Error getting volume:", error)
    return NextResponse.json({ volume: 50 }) // Default volume
  }
}
