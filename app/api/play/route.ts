import { NextResponse } from "next/server"
import { spawn } from "child_process"
import { homedir } from "os"
import path from "path"

let currentProcess: any = null

export async function POST(request: Request) {
  try {
    const { fileName } = await request.json()

    if (!fileName) {
      return NextResponse.json({ error: "File name is required" }, { status: 400 })
    }

    // Stop any currently playing process
    if (currentProcess) {
      currentProcess.kill()
      currentProcess = null
    }

    // Construct the full file path
    const homeDirectory = homedir()
    const filePath = path.join(homeDirectory, "Music", fileName)

    console.log(`Attempting to play: ${filePath}`)

    // Start playing the file
    currentProcess = spawn("aplay", [filePath], {
      stdio: ["ignore", "pipe", "pipe"],
    })

    currentProcess.stdout?.on("data", (data: Buffer) => {
      console.log(`aplay stdout: ${data}`)
    })

    currentProcess.stderr?.on("data", (data: Buffer) => {
      console.error(`aplay stderr: ${data}`)
    })

    currentProcess.on("close", (code: number) => {
      console.log(`aplay process exited with code ${code}`)
      currentProcess = null
    })

    currentProcess.on("error", (error: Error) => {
      console.error("aplay error:", error)
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
