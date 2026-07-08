import { type NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir, unlink } from "fs/promises"
import { join } from "path"
import { homedir } from "os"
import { spawn } from "child_process"

/**
 * Execute ffmpeg safely using spawn (prevents command injection)
 * @param inputPath Path to input file
 * @param outputPath Path to output file
 * @param timeoutMs Timeout in milliseconds
 */
function executeFFmpeg(inputPath: string, outputPath: string, timeoutMs: number = 300000): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const args = [
      "-i", inputPath,
      "-acodec", "pcm_s16le",
      "-ac", "2",
      "-ar", "44100",
      "-y", outputPath
    ];
    
    const process = spawn("ffmpeg", args, { timeout: timeoutMs });
    
    let stdout = "";
    let stderr = "";
    
    process.stdout?.on("data", (data) => {
      stdout += data.toString();
    });
    
    process.stderr?.on("data", (data) => {
      stderr += data.toString();
    });
    
    const timer = setTimeout(() => {
      process.kill();
      reject(new Error("FFmpeg timeout"));
    }, timeoutMs);
    
    process.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`ffmpeg failed with code ${code}: ${stderr}`));
      }
    });
    
    process.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
  });
}

/**
 * Remove a file safely using native fs API (no shell)
 * @param filePath Path to file to remove
 */
async function removeFile(filePath: string): Promise<void> {
  try {
    await unlink(filePath);
  } catch (error) {
    // File may not exist, that's ok
    console.warn(`Failed to remove file ${filePath}:`, error instanceof Error ? error.message : "Unknown error");
  }
}

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
    // Replace whitespace and special characters with dash for filenames
    const safeOriginalName = originalName.replace(/[^\w\-\.]/g, "-").replace(/\-+/g, "-")
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
      console.log(`Processing audio file with ffmpeg: ${tempFilePath} -> ${finalFilePath}`)

      // Use spawn for safe execution (no shell injection possible)
      const { stdout, stderr } = await executeFFmpeg(tempFilePath, finalFilePath, 300000)

      if (stderr) {
        console.log("FFmpeg stderr:", stderr)
      }
      if (stdout) {
        console.log("FFmpeg stdout:", stdout)
      }

      // Remove temporary file using native fs API (no shell)
      await removeFile(tempFilePath)

      console.log(`File processed and saved as: ${finalFilePath}`)

      return NextResponse.json({
        success: true,
        message: "File uploaded and processed successfully",
        fileName: finalFileName,
        originalName: file.name,
      })
    } catch (ffmpegError) {
      console.error("FFmpeg processing failed:", ffmpegError)

      // Clean up temp file on error using native fs API
      await removeFile(tempFilePath)

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
