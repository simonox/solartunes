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

// Check if service management script exists
async function hasServiceManagement(): Promise<boolean> {
  try {
    await access("/home/pi/solartunes/scripts/manage-sdcard-with-service.sh")
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

    // Check RAM disk usage
    try {
      const { stdout: ramUsage } = await execAsync(
        "du -sh /tmp/solartunes-ram 2>/dev/null || echo '0 /tmp/solartunes-ram'",
      )
      const ramParts = ramUsage.trim().split(/\s+/)
      if (ramParts.length >= 2) {
        sdCardInfo.ramDiskUsage = ramParts[0]
      }
    } catch (error) {
      sdCardInfo.ramDiskUsage = "unknown"
    }

    // Check if SolarTunes service is running
    try {
      const { stdout: serviceStatus } = await execAsync("systemctl is-active solartunes 2>/dev/null || echo 'inactive'")
      sdCardInfo.serviceRunning = serviceStatus.trim() === "active"
    } catch (error) {
      sdCardInfo.serviceRunning = false
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
    sdCardInfo.hasServiceManagement = await hasServiceManagement()

    // Check for busy processes that might prevent locking
    try {
      const { stdout: busyProcesses } = await execAsync(
        "lsof / 2>/dev/null | grep -v 'solartunes\\|bash\\|sh\\|sudo' | head -5 || echo ''",
      )
      sdCardInfo.busyProcesses = busyProcesses.trim().length > 0
      if (sdCardInfo.busyProcesses) {
        sdCardInfo.busyProcessCount = (busyProcesses.match(/\n/g) || []).length + 1
      }
    } catch (error) {
      sdCardInfo.busyProcesses = false
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
    const hasServiceMgmt = await hasServiceManagement()

    if (action === "remountReadOnly") {
      console.log("Safely locking SD card with service management...")

      try {
        if (hasServiceMgmt) {
          // Use the safe service management script
          const { stdout, stderr } = await execAsync("/home/pi/solartunes/scripts/manage-sdcard-with-service.sh lock")
          console.log("Safe lock output:", stdout)
          if (stderr) console.log("Safe lock stderr:", stderr)

          // Verify the lock was successful
          const { stdout: mountInfo } = await execAsync("mount | grep ' / ' | head -1")
          const isReadOnly = mountInfo.includes("ro,") || mountInfo.includes("(ro)")

          if (isReadOnly) {
            return NextResponse.json({
              success: true,
              message: "SD card safely locked with service restart",
              readOnly: true,
              serviceRestarted: true,
            })
          } else {
            throw new Error("Safe lock completed but filesystem is still read-write")
          }
        } else {
          // Fallback to basic method
          const useWrapper = await hasWrapperScript()

          // First, sync all pending writes
          await execAsync("sync")

          if (useWrapper) {
            await execAsync("sudo /usr/local/bin/solartunes-mount lock")
          } else {
            await execAsync("sudo mount -o remount,ro /")
          }

          return NextResponse.json({
            success: true,
            message: "SD card locked (service may need manual restart)",
            readOnly: true,
            serviceRestarted: false,
          })
        }
      } catch (error) {
        console.error("Failed to safely lock SD card:", error)
        return NextResponse.json(
          {
            error: "Failed to safely lock SD card",
            details: error instanceof Error ? error.message : "Unknown error",
          },
          { status: 500 },
        )
      }
    } else if (action === "remountReadWrite") {
      console.log("Safely unlocking SD card with service management...")

      try {
        if (hasServiceMgmt) {
          // Use the safe service management script
          const { stdout, stderr } = await execAsync("/home/pi/solartunes/scripts/manage-sdcard-with-service.sh unlock")
          console.log("Safe unlock output:", stdout)
          if (stderr) console.log("Safe unlock stderr:", stderr)

          // Verify the unlock was successful
          const { stdout: mountInfo } = await execAsync("mount | grep ' / ' | head -1")
          const isReadOnly = mountInfo.includes("ro,") || mountInfo.includes("(ro)")

          if (!isReadOnly) {
            return NextResponse.json({
              success: true,
              message: "SD card safely unlocked with service restart",
              readOnly: false,
              serviceRestarted: true,
            })
          } else {
            throw new Error("Safe unlock completed but filesystem is still read-only")
          }
        } else {
          // Fallback to basic method
          const useWrapper = await hasWrapperScript()

          if (useWrapper) {
            await execAsync("sudo /usr/local/bin/solartunes-mount unlock")
          } else {
            await execAsync("sudo mount -o remount,rw /")
          }

          return NextResponse.json({
            success: true,
            message: "SD card unlocked (service may need manual restart)",
            readOnly: false,
            serviceRestarted: false,
          })
        }
      } catch (error) {
        console.error("Failed to safely unlock SD card:", error)
        return NextResponse.json(
          {
            error: "Failed to safely unlock SD card",
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
