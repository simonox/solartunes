import { NextResponse } from "next/server"
import { readdir } from "fs/promises"
import { join } from "path"
import { homedir } from "os"

export async function GET() {
  try {
    const musicDir = join(homedir(), "Music")
    console.log(`Reading files from: ${musicDir}`)

    const files = await readdir(musicDir)
    const wavFiles = files
      .filter((file) => file.toLowerCase().endsWith(".wav"))
      .map((file) => ({
        name: file,
        path: join(musicDir, file),
      }))

    console.log(`Found ${wavFiles.length} .wav files in ${musicDir}`)
    return NextResponse.json({ files: wavFiles })
  } catch (error) {
    console.error("Error listing files:", error)
    return NextResponse.json({
      files: [],
      error: "Failed to list files",
      details: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
