import { NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"
import { homedir } from "os"
import path from "path"

const execAsync = promisify(exec)

export async function GET() {
  try {
    // Get the home directory and construct the Music path
    const homeDirectory = homedir()
    const musicDirectory = path.join(homeDirectory, "Music")

    // Use find command with proper path escaping
    const command = `find "${musicDirectory}" -name "*.wav" -type f 2>/dev/null || echo ""`
    const { stdout, stderr } = await execAsync(command)

    if (stderr && !stderr.includes("No such file")) {
      console.error("Command stderr:", stderr)
    }

    const files = stdout
      .trim()
      .split("\n")
      .filter((line) => line.length > 0 && line !== "")
      .map((filePath) => ({
        name: path.basename(filePath),
        path: filePath,
      }))

    console.log(`Found ${files.length} .wav files in ${musicDirectory}`)
    return NextResponse.json({ files })
  } catch (error) {
    console.error("Error listing files:", error)
    return NextResponse.json({
      files: [],
      error: "Failed to list files",
      details: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
