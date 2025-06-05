import { NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

export async function GET() {
  try {
    // Check if aplay is running
    try {
      await execAsync("pgrep -f aplay")
      return NextResponse.json({ playing: true })
    } catch {
      // pgrep returns non-zero exit code if no processes found
      return NextResponse.json({ playing: false })
    }
  } catch (error) {
    console.error("Error checking status:", error)
    return NextResponse.json({ playing: false })
  }
}
