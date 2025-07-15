import { type NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { homedir } from "os"
import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Check if file is a WAV file
    if (!file.name.toLowerCase().endsWith(".wav")) {
      return NextResponse.json({ error: "Only WAV files are accepted" }, { status: 400 })
    }

    const musicDir = join(homedir(), "Music")

    // Ensure Music directory exists
    try {
      await mkdir(musicDir, { recursive: true })
    } catch (error) {
      // Directory might already exist, that's fine
    }

    // Create unique filename to avoid conflicts
    const timestamp = Date.now()
    const originalName = file.name.replace(/\.wav$/i, "")
    // Replace whitespace with dash for filenames
    const safeOriginalName = originalName.replace(/\s+/g, "-")
    const tempFileName = `${safeOriginalName}_temp_${timestamp}.wav`
    const finalFileName = `${safeOriginalName}_${timestamp}.wav`
    const tempFilePath = join(musicDir, tempFileName)
    const finalFilePath = join(musicDir, finalFileName)

    // Save uploaded file temporarily
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(tempFilePath, buffer)

    console.log(`Uploaded file saved to: ${tempFilePath}`)

    // Process the file with ffmpeg to ensure correct format
    try {

      const ffmpegCommand = `ffmpeg -i "${tempFilePath}" -acodec pcm_s16le -ac 2 -ar 44100 -y "${finalFilePath}"`
      console.log(`Running ffmpeg command: ${ffmpegCommand}`)

      // Set timeout to 5 minutes (300000 ms)
      const { stdout, stderr } = await execAsync(ffmpegCommand, { timeout: 300000 })

      if (stderr) {
        console.log("FFmpeg stderr:", stderr)
      }
      if (stdout) {
        console.log("FFmpeg stdout:", stdout)
      }

      // Remove temporary file
      try {
        await execAsync(`rm "${tempFilePath}"`, { timeout: 300000 })
      } catch (cleanupError) {
        console.warn("Failed to cleanup temp file:", cleanupError)
      }

      console.log(`File processed and saved as: ${finalFilePath}`)

      return NextResponse.json({
        success: true,
        message: "File uploaded and processed successfully",
        fileName: finalFileName,
        originalName: file.name,
      })
    } catch (ffmpegError) {
      console.error("FFmpeg processing failed:", ffmpegError)

      // Clean up temp file on error
      try {
        await execAsync(`rm "${tempFilePath}"`, { timeout: 300000 })
      } catch (cleanupError) {
        console.warn("Failed to cleanup temp file after error:", cleanupError)
      }

      return NextResponse.json(
        {
          error: "Failed to process audio file",
          details: ffmpegError instanceof Error ? ffmpegError.message : "Unknown ffmpeg error",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      {
        error: "Failed to upload file",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
