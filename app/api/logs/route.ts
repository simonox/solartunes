import { NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

export async function GET() {
  try {
    // Get recent system logs related to solartunes and audio
    const commands = [
      "journalctl -u solartunes -n 10 --no-pager --output=short-iso",
      "journalctl -n 20 --no-pager --output=short-iso | grep -E 'solartunes|aplay|audio|ALSA' | tail -10",
    ]

    let logs: string[] = []

    for (const command of commands) {
      try {
        const { stdout } = await execAsync(command)
        const commandLogs = stdout
          .trim()
          .split("\n")
          .filter((line) => line.length > 0)
        logs = logs.concat(commandLogs)
      } catch (error) {
        console.log(`Command failed: ${command}`)
      }
    }

    // Remove duplicates and sort by timestamp
    logs = [...new Set(logs)]
    logs.sort()

    // If no logs found, add a status message
    if (logs.length === 0) {
      const currentTime = new Date().toISOString().slice(0, 19).replace("T", " ")
      logs = [`${currentTime} No recent system logs found`]
    }

    return NextResponse.json({ logs: logs.slice(-20) }) // Return last 20 logs
  } catch (error) {
    console.error("Error fetching logs:", error)
    const currentTime = new Date().toISOString().slice(0, 19).replace("T", " ")
    return NextResponse.json({
      logs: [`${currentTime} Error fetching system logs: ${error instanceof Error ? error.message : "Unknown error"}`],
    })
  }
}
