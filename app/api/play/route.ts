import { NextResponse } from "next/server"
import { spawn } from "child_process"
import { join } from "path"
import { homedir } from "os"
import { access } from "fs/promises"

// Store the current playing process
let currentProcess: any = null

export async function POST(request: Request) {
  try {
    const { fileName } = await request.json()

    if (!fileName) {
      return NextResponse.json({ error: "File name is required" }, { status: 400 })
    }

    // Stop any currently playing audio
    if (currentProcess) {
      currentProcess.kill()
      currentProcess = null
    }

    const filePath = join(homedir(), "Music", fileName)

    // Check if file exists
    try {
      await access(filePath)
    } catch {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    console.log(`Playing file: ${filePath}`)

    // Start aplay process
    currentProcess = spawn("aplay", [filePath], {
      stdio: ["ignore", "pipe", "pipe"],
    })

    currentProcess.on("exit", (code: number) => {
      console.log(`aplay exited with code ${code}`)
      currentProcess = null
    })

    currentProcess.on("error", (error: Error) => {
      console.error(`aplay error: ${error.message}`)
      currentProcess = null
    })

    return NextResponse.json({ success: true, message: `Playing ${fileName}` })
  } catch (error) {
    console.error("Error playing file:", error)
    return NextResponse.json(
      {
        error: "Failed to play file",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
