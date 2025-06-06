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
      try {
        currentProcess.kill("SIGTERM")
        // Also kill any remaining aplay processes
        spawn("pkill", ["-f", "aplay"], { stdio: "ignore" })
      } catch (error) {
        console.log("Error stopping previous process:", error)
      }
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

    // Use HiFiBerry DAC+ optimized settings but keep it simple
    currentProcess = spawn(
      "aplay",
      [
        "-D",
        "hw:0,0", // Direct HiFiBerry DAC+ access
        filePath,
      ],
      {
        detached: true, // This should prevent Node.js from killing the process
        stdio: ["ignore", "pipe", "pipe"],
      },
    )

    // Unref the process so it doesn't keep the Node.js process alive
    currentProcess.unref()

    let hasExited = false

    currentProcess.on("exit", (code: number, signal: string) => {
      if (hasExited) return
      hasExited = true

      console.log(`aplay exited with code ${code}, signal: ${signal}`)

      if (code === 0) {
        console.log(`Successfully finished playing ${fileName}`)
      } else if (code === 1) {
        console.error(`aplay failed with error code 1 for ${fileName}`)
        console.error("This might be due to:")
        console.error("- Audio device busy or unavailable")
        console.error("- Unsupported audio format")
        console.error("- File corruption")
        console.error("- Audio system configuration issues")
      } else {
        console.error(`aplay failed with unexpected code ${code} for ${fileName}`)
      }

      currentProcess = null
    })

    currentProcess.on("error", (error: Error) => {
      if (hasExited) return
      hasExited = true

      console.error(`aplay process error: ${error.message}`)
      currentProcess = null
    })

    // Capture stderr for better error reporting
    if (currentProcess.stderr) {
      currentProcess.stderr.on("data", (data: Buffer) => {
        const errorOutput = data.toString().trim()
        if (errorOutput) {
          console.error(`aplay stderr: ${errorOutput}`)
        }
      })
    }

    // Capture stdout for any output
    if (currentProcess.stdout) {
      currentProcess.stdout.on("data", (data: Buffer) => {
        const output = data.toString().trim()
        if (output) {
          console.log(`aplay stdout: ${output}`)
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: `Playing ${fileName}`,
      pid: currentProcess.pid,
    })
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
