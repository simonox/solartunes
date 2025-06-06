import { NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

export async function GET() {
  try {
    // Get CPU temperature using vcgencmd
    const { stdout } = await execAsync("vcgencmd measure_temp")

    // Parse temperature from output like "temp=42.8'C"
    const tempMatch = stdout.match(/temp=([0-9.]+)'C/)

    if (tempMatch) {
      const temperature = Number.parseFloat(tempMatch[1])
      return NextResponse.json({
        temperature,
        unit: "°C",
        status: temperature > 70 ? "hot" : temperature > 50 ? "warm" : "normal",
      })
    } else {
      throw new Error("Could not parse temperature output")
    }
  } catch (error) {
    console.error("Error getting temperature:", error)

    // Fallback: try reading from thermal zone
    try {
      const { stdout: thermalOutput } = await execAsync("cat /sys/class/thermal/thermal_zone0/temp")
      const tempMilliC = Number.parseInt(thermalOutput.trim())
      const temperature = tempMilliC / 1000

      return NextResponse.json({
        temperature,
        unit: "°C",
        status: temperature > 70 ? "hot" : temperature > 50 ? "warm" : "normal",
        source: "thermal_zone",
      })
    } catch (thermalError) {
      return NextResponse.json(
        {
          error: "Temperature monitoring not available",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 },
      )
    }
  }
}
