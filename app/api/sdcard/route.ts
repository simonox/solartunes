import { NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

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

    if (action === "remountReadOnly") {
      console.log("Remounting filesystem as read-only...")

      try {
        // Sync all pending writes first
        await execAsync("sync")

        // Remount root filesystem as read-only
        await execAsync("sudo mount -o remount,ro /")

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
        // Remount root filesystem as read-write
        await execAsync("sudo mount -o remount,rw /")

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
