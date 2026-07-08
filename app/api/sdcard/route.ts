import { NextResponse } from "next/server"
import { spawn } from "child_process"
import { access } from "fs/promises"

// Check if wrapper script exists
async function hasWrapperScript(): Promise<boolean> {
  try {
    await access("/usr/local/bin/solartunes-mount")
    return true
  } catch {
    return false
  }
}

// Check if safe management script exists
async function hasSafeManagement(): Promise<boolean> {
  try {
    await access("/home/pi/solartunes/scripts/safe-sdcard-manager.sh")
    return true
  } catch {
    return false
  }
}

/**
 * Execute a command safely using spawn
 * @param command Command to execute
 * @param args Arguments for the command
 */
function executeCommand(command: string, args: string[]): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args);
    
    let stdout = "";
    let stderr = "";
    
    process.stdout?.on("data", (data) => {
      stdout += data.toString();
    });
    
    process.stderr?.on("data", (data) => {
      stderr += data.toString();
    });
    
    process.on("close", (code) => {
      // Don't reject on non-zero exit codes, just pass the output
      resolve({ stdout, stderr });
    });
    
    process.on("error", (error) => {
      reject(error);
    });
  });
}

export async function GET() {
  try {
    const sdCardInfo: any = {
      timestamp: new Date().toISOString(),
    }

    // Check if SD card is mounted as read-only
    try {
      const { stdout: mountInfo } = await executeCommand("mount", [])
      const mountLines = mountInfo.split("\n").filter(line => line.includes(" / "));
      const isReadOnly = mountLines.some(line => line.includes("ro,") || line.includes("(ro)"))
      sdCardInfo.readOnly = isReadOnly
      sdCardInfo.mountInfo = mountLines[0]?.trim() || ""
    } catch (error) {
      sdCardInfo.readOnlyError = "Could not determine mount status"
    }

    // Get SD card usage information
    try {
      const { stdout: diskUsage } = await executeCommand("df", ["-h", "/"])
      const lines = diskUsage.trim().split("\n")
      const parts = lines[lines.length - 1]?.split(/\s+/) || []
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
      const { stdout: ramUsage } = await executeCommand("du", ["-sh", "/tmp/solartunes-ram"])
      const ramParts = ramUsage.trim().split(/\s+/)
      if (ramParts.length >= 1) {
        sdCardInfo.ramDiskUsage = ramParts[0]
      }
    } catch (error) {
      sdCardInfo.ramDiskUsage = "unknown"
    }

    // Check if SolarTunes service is running
    try {
      const { stdout: serviceStatus } = await executeCommand("systemctl", ["is-active", "solartunes"])
      sdCardInfo.serviceRunning = serviceStatus.trim() === "active"
    } catch (error) {
      sdCardInfo.serviceRunning = false
    }

    // Check for busy processes that might prevent locking
    try {
      const { stdout: busyProcesses } = await executeCommand("lsof", ["/"])
      const lines = busyProcesses.split("\n")
        .filter(line => !line.includes("COMMAND") && !line.includes("systemd") && !line.includes("kernel") && line.trim())
        .slice(0, 5)
      sdCardInfo.busyProcesses = lines.length > 0
      if (sdCardInfo.busyProcesses) {
        sdCardInfo.busyProcessCount = lines.length
        sdCardInfo.busyProcessesSample = lines
      }
    } catch (error) {
      sdCardInfo.busyProcesses = false
    }

    // Check SD card health (if available)
    try {
      const { stdout: sdHealth } = await executeCommand("dmesg", [])
      sdCardInfo.healthInfo = sdHealth
        .split("\n")
        .filter(line => line.toLowerCase().includes("mmc") || line.toLowerCase().includes("sd"))
        .slice(-5)
    } catch (error) {
      sdCardInfo.healthInfo = []
    }

    // Check for write protection hardware switch
    try {
      const { stdout: writeProtect } = await executeCommand("cat", ["/sys/block/mmcblk0/ro"])
      sdCardInfo.hardwareWriteProtect = writeProtect.trim() === "1"
    } catch (error) {
      sdCardInfo.hardwareWriteProtect = null
    }

    // Check filesystem type
    try {
      const { stdout: fsType } = await executeCommand("findmnt", ["-n", "-o", "FSTYPE", "/"])
      sdCardInfo.filesystem = fsType.trim()
    } catch (error) {
      sdCardInfo.filesystem = "unknown"
    }

    // Check if management scripts are available
    sdCardInfo.hasWrapper = await hasWrapperScript()
    sdCardInfo.hasSafeManagement = await hasSafeManagement()

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
    const hasSafeMgmt = await hasSafeManagement()

    if (action === "remountReadOnly") {
      console.log("Attempting safe SD card lock...")

      try {
        if (hasSafeMgmt) {
          // Use the safe management script
          const { stdout, stderr } = await executeCommand("/home/pi/solartunes/scripts/safe-sdcard-manager.sh", ["lock"])
          console.log("Safe lock output:", stdout)
          if (stderr) console.log("Safe lock stderr:", stderr)

          // Verify the lock was successful
          const { stdout: mountInfo } = await executeCommand("mount", [])
          const mountLines = mountInfo.split("\n").filter(line => line.includes(" / "))
          const isReadOnly = mountLines.some(line => line.includes("ro,") || line.includes("(ro)"))

          if (isReadOnly) {
            return NextResponse.json({
              success: true,
              message: "SD card safely locked with service management",
              readOnly: true,
              method: "safe",
            })
          } else {
            // If safe method failed, suggest emergency method
            return NextResponse.json(
              {
                error: "Safe lock failed - filesystem may be busy",
                suggestion: "Try using emergency lock or check for busy processes",
                busyProcesses: true,
              },
              { status: 500 },
            )
          }
        } else {
          // Fallback to basic method with better error handling
          const useWrapper = await hasWrapperScript()

          try {
            // First, sync all pending writes
            await executeCommand("sync", [])

            if (useWrapper) {
              await executeCommand("sudo", ["/usr/local/bin/solartunes-mount", "lock"])
            } else {
              await executeCommand("sudo", ["mount", "-o", "remount,ro", "/"])
            }

            return NextResponse.json({
              success: true,
              message: "SD card locked (basic method)",
              readOnly: true,
              method: "basic",
            })
          } catch (lockError) {
            return NextResponse.json(
              {
                error: "Failed to lock SD card - filesystem is busy",
                details: lockError instanceof Error ? lockError.message : "Unknown error",
                suggestion: "Install improved SD card protection scripts",
              },
              { status: 500 },
            )
          }
        }
      } catch (error) {
        console.error("Failed to lock SD card:", error)
        return NextResponse.json(
          {
            error: "Failed to lock SD card",
            details: error instanceof Error ? error.message : "Unknown error",
          },
          { status: 500 },
        )
      }
    } else if (action === "remountReadWrite") {
      console.log("Attempting safe SD card unlock...")

      try {
        if (hasSafeMgmt) {
          // Use the safe management script
          const { stdout, stderr } = await executeCommand("/home/pi/solartunes/scripts/safe-sdcard-manager.sh", ["unlock"])
          console.log("Safe unlock output:", stdout)
          if (stderr) console.log("Safe unlock stderr:", stderr)

          // Verify the unlock was successful
          const { stdout: mountInfo } = await executeCommand("mount", [])
          const mountLines = mountInfo.split("\n").filter(line => line.includes(" / "))
          const isReadOnly = mountLines.some(line => line.includes("ro,") || line.includes("(ro)"))

          if (!isReadOnly) {
            return NextResponse.json({
              success: true,
              message: "SD card safely unlocked with service management",
              readOnly: false,
              method: "safe",
            })
          } else {
            throw new Error("Safe unlock completed but filesystem is still read-only")
          }
        } else {
          // Fallback to basic method
          const useWrapper = await hasWrapperScript()

          if (useWrapper) {
            await executeCommand("sudo", ["/usr/local/bin/solartunes-mount", "unlock"])
          } else {
            await executeCommand("sudo", ["mount", "-o", "remount,rw", "/"])
          }

          return NextResponse.json({
            success: true,
            message: "SD card unlocked (basic method)",
            readOnly: false,
            method: "basic",
          })
        }
      } catch (error) {
        console.error("Failed to unlock SD card:", error)
        return NextResponse.json(
          {
            error: "Failed to unlock SD card",
            details: error instanceof Error ? error.message : "Unknown error",
          },
          { status: 500 },
        )
      }
    } else if (action === "checkBusyProcesses") {
      // New action to check for busy processes
      try {
        const { stdout: busyProcesses } = await executeCommand("lsof", ["/"])
        const lines = busyProcesses.split("\n")
          .filter(line => !line.includes("COMMAND") && !line.includes("systemd") && !line.includes("kernel") && line.trim())
          .slice(0, 10)

        return NextResponse.json({
          success: true,
          busyProcesses: lines.length > 0,
          processes: lines,
        })
      } catch (error) {
        return NextResponse.json({
          success: false,
          error: "Failed to check busy processes",
        })
      }
    } else {
      return NextResponse.json(
        { error: "Invalid action. Use 'remountReadOnly', 'remountReadWrite', or 'checkBusyProcesses'" },
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

          if (isReadOnly) {
            return NextResponse.json({
              success: true,
              message: "SD card safely locked with service management",
              readOnly: true,
              method: "safe",
            })
          } else {
            // If safe method failed, suggest emergency method
            return NextResponse.json(
              {
                error: "Safe lock failed - filesystem may be busy",
                suggestion: "Try using emergency lock or check for busy processes",
                busyProcesses: true,
              },
              { status: 500 },
            )
          }
        } else {
          // Fallback to basic method with better error handling
          const useWrapper = await hasWrapperScript()

          try {
            // First, sync all pending writes
            await execAsync("sync")

            if (useWrapper) {
              await execAsync("sudo /usr/local/bin/solartunes-mount lock")
            } else {
              await execAsync("sudo mount -o remount,ro /")
            }

            return NextResponse.json({
              success: true,
              message: "SD card locked (basic method)",
              readOnly: true,
              method: "basic",
            })
          } catch (lockError) {
            return NextResponse.json(
              {
                error: "Failed to lock SD card - filesystem is busy",
                details: lockError instanceof Error ? lockError.message : "Unknown error",
                suggestion: "Install improved SD card protection scripts",
              },
              { status: 500 },
            )
          }
        }
      } catch (error) {
        console.error("Failed to lock SD card:", error)
        return NextResponse.json(
          {
            error: "Failed to lock SD card",
            details: error instanceof Error ? error.message : "Unknown error",
          },
          { status: 500 },
        )
      }
    } else if (action === "remountReadWrite") {
      console.log("Attempting safe SD card unlock...")

      try {
        if (hasSafeMgmt) {
          // Use the safe management script
          const { stdout, stderr } = await execAsync("/home/pi/solartunes/scripts/safe-sdcard-manager.sh unlock")
          console.log("Safe unlock output:", stdout)
          if (stderr) console.log("Safe unlock stderr:", stderr)

          // Verify the unlock was successful
          const { stdout: mountInfo } = await execAsync("mount | grep ' / ' | head -1")
          const isReadOnly = mountInfo.includes("ro,") || mountInfo.includes("(ro)")

          if (!isReadOnly) {
            return NextResponse.json({
              success: true,
              message: "SD card safely unlocked with service management",
              readOnly: false,
              method: "safe",
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
            message: "SD card unlocked (basic method)",
            readOnly: false,
            method: "basic",
          })
        }
      } catch (error) {
        console.error("Failed to unlock SD card:", error)
        return NextResponse.json(
          {
            error: "Failed to unlock SD card",
            details: error instanceof Error ? error.message : "Unknown error",
          },
          { status: 500 },
        )
      }
    } else if (action === "checkBusyProcesses") {
      // New action to check for busy processes
      try {
        const { stdout: busyProcesses } = await execAsync(
          "lsof / 2>/dev/null | grep -v 'COMMAND\\|systemd\\|kernel' | head -10 || echo ''",
        )

        return NextResponse.json({
          success: true,
          busyProcesses: busyProcesses.trim().length > 0,
          processes: busyProcesses.split("\n").filter((line) => line.trim()),
        })
      } catch (error) {
        return NextResponse.json({
          success: false,
          error: "Failed to check busy processes",
        })
      }
    } else {
      return NextResponse.json(
        { error: "Invalid action. Use 'remountReadOnly', 'remountReadWrite', or 'checkBusyProcesses'" },
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
