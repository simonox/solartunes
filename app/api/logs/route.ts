import { NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

export async function GET() {
  try {
    // Get last 20 lines from system log
    const { stdout } = await execAsync(
      'tail -n 20 /var/log/syslog 2>/dev/null || tail -n 20 /var/log/messages 2>/dev/null || echo "No logs available"',
    )

    const logs = stdout
      .trim()
      .split("\n")
      .filter((line) => line.length > 0)
      .slice(-20) // Keep only last 20 lines

    return NextResponse.json({ logs })
  } catch (error) {
    console.error("Error fetching logs:", error)
    return NextResponse.json({ logs: ["Error fetching system logs"] })
  }
}
