import { NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

export async function GET() {
  try {
    const { stdout } = await execAsync("pgrep -f aplay || true")
    const playing = stdout.trim().length > 0

    return NextResponse.json({ playing })
  } catch (error) {
    console.error("Error checking status:", error)
    return NextResponse.json({ playing: false })
  }
}
