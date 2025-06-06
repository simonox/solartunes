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

    // Use the working command format you discovered with card 0
    const command = `amixer sset 'Master' ${volume}%`

    try {
      console.log(`Executing command: ${command}`)
      await execAsync(command)
      console.log(`Successfully set volume to ${volume}%`)
      return NextResponse.json({ success: true, volume })
    } catch (error) {
      console.error("Error setting volume:", error)
      return NextResponse.json(
        {
          error: "Failed to set volume",
          details: error instanceof Error ? error.message : "Unknown error",
          command: command,
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
    // Get current volume level using the working command format with card 0
    const command = "amixer -c 0 sget 'Master'"

    console.log(`Getting volume with: ${command}`)
    const { stdout } = await execAsync(command)

    // Parse the output to extract volume percentage
    const volumeMatch = stdout.match(/\[(\d+)%\]/)
    if (volumeMatch) {
      const volume = Number.parseInt(volumeMatch[1])
      console.log(`Got volume ${volume}% from Master control`)
      return NextResponse.json({ volume })
    }

    // Try to parse absolute values if percentage not found
    const absoluteMatch = stdout.match(/\[(\d+)\/(\d+)\]/)
    if (absoluteMatch) {
      const current = Number.parseInt(absoluteMatch[1])
      const max = Number.parseInt(absoluteMatch[2])
      const volume = Math.round((current / max) * 100)
      console.log(`Got volume ${volume}% (${current}/${max}) from Master control`)
      return NextResponse.json({ volume })
    }

    console.log("Could not parse volume from amixer output:", stdout)
    return NextResponse.json({ volume: 50 }) // Default volume
  } catch (error) {
    console.error("Error getting volume:", error)
    return NextResponse.json({ volume: 50 }) // Default volume
  }
}
