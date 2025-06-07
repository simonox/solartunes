import { NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"
import { access } from "fs/promises"

const execAsync = promisify(exec)

// Check if wrapper script exists
async function hasWrapperScript(): Promise<boolean> {
  try {
    await access("/usr/local/bin/solartunes-mount")
    return true
  } catch {
    return false
  }
}

export async function GET() {
  try {
    const sdCardInfo: any = {
      timestamp: new Date().toISOString(),
    }

    // Check if SD card is mounted as read-only
    try {
      const { stdout: mountInfo } = await execAsync("mount | grep ' / ' | head -1")
      const isReadOnly = mountInfo.includes("ro,") || mountInfo.includes("(ro)")
      sdCardInfo.readOnly = isReadOnly
      sdCardInfo.mountInfo = mountInfo.trim()
    } catch (error) {
      sdCardInfo.readOnlyError = "Could not determine mount status"
    }

    // Get SD card usage information
    try {
      const { stdout: diskUsage } = await execAsync("df -h / | tail -1")
      const parts = diskUsage.trim().split(/\s+/)
      if (parts.length >= 5) {
        sdCardInfo.usage = {
          total: parts[1],
          used: parts[2],
          available: parts[3],
          percentage: parts[4],
        }
      }
    } catch (error) {
      sdCardInfo.usageError = "Could not get disk usage"
    }

    // Check SD card health (if available)
    try {
      const { stdout: sdHealth } = await execAsync("dmesg | grep -i 'mmc\\|sd' | tail -5")
      sdCardInfo.healthInfo = sdHealth.split("\n").filter((line) => line.trim())
    } catch (error) {
      sdCardInfo.healthInfo = []
    }

    // Check for write protection hardware switch
    try {
      const { stdout: writeProtect } = await execAsync("cat /sys/block/mmcblk0/ro 2>/dev/null || echo 'unknown'")
      sdCardInfo.hardwareWriteProtect = writeProtect.trim() === "1"
    } catch (error) {
      sdCardInfo.hardwareWriteProtect = null
    }

    // Check filesystem type
    try {
      const { stdout: fsType } = await execAsync("findmnt -n -o FSTYPE /")
      sdCardInfo.filesystem = fsType.trim()
    } catch (error) {
      sdCardInfo.filesystem = "unknown"
    }

    // Check if wrapper script is available
    sdCardInfo.hasWrapper = await hasWrapperScript()

    return NextResponse.json(sdCardInfo)
  } catch (error) {
    console.error("Error getting SD card info:", error)
    return NextResponse.json({
      error: "Failed to get SD card information",
      details: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

export async function POST(request: Request) {
  try {
    const { action } = await request.json()
    const useWrapper = await hasWrapperScript()

    if (action === "remountReadOnly") {
      console.log("Remounting filesystem as read-only...")

      try {
        if (useWrapper) {
          // Use wrapper script
          await execAsync("sudo /usr/local/bin/solartunes-mount lock")
        } else {
          // Use direct mount commands
          await execAsync("sync")
          await execAsync("sudo mount -o remount,ro /")
        }

        return NextResponse.json({
          success: true,
          message: "Filesystem remounted as read-only",
          readOnly: true,
        })
      } catch (error) {
        console.error("Failed to remount as read-only:", error)
        return NextResponse.json(
          {
            error: "Failed to remount as read-only",
            details: error instanceof Error ? error.message : "Unknown error",
          },
          { status: 500 },
        )
      }
    } else if (action === "remountReadWrite") {
      console.log("Remounting filesystem as read-write...")

      try {
        if (useWrapper) {
          // Use wrapper script
          await execAsync("sudo /usr/local/bin/solartunes-mount unlock")
        } else {
          // Use direct mount command
          await execAsync("sudo mount -o remount,rw /")
        }

        return NextResponse.json({
          success: true,
          message: "Filesystem remounted as read-write",
          readOnly: false,
        })
      } catch (error) {
        console.error("Failed to remount as read-write:", error)
        return NextResponse.json(
          {
            error: "Failed to remount as read-write",
            details: error instanceof Error ? error.message : "Unknown error",
          },
          { status: 500 },
        )
      }
    } else {
      return NextResponse.json(
        { error: "Invalid action. Use 'remountReadOnly' or 'remountReadWrite'" },
        { status: 400 },
      )
    }
  } catch (error) {
    console.error("Error processing SD card request:", error)
    return NextResponse.json(
      {
        error: "Failed to process SD card request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
