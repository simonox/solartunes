import { NextResponse } from "next/server"
import { spawn } from "child_process"

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

export async function POST() {
  try {
    console.log("Performing aggressive audio cleanup...")

    const cleanupResults: string[] = []

    // 1. Kill all audio processes
    try {
      await executeCommand("pkill", ["-KILL", "-f", "aplay|mpg123|vlc|mplayer"])
      cleanupResults.push("Killed all audio processes")
    } catch (error) {
      cleanupResults.push("No audio processes to kill")
    }

    // 2. Reset ALSA
    try {
      await executeCommand("alsactl", ["restore"])
      cleanupResults.push("ALSA configuration restored")
    } catch (error) {
      cleanupResults.push("ALSA restore failed (may not be available)")
    }

    // 3. Reload audio modules (if possible)
    try {
      await executeCommand("sudo", ["modprobe", "-r", "snd_pcm"])
      await executeCommand("sudo", ["modprobe", "snd_pcm"])
      cleanupResults.push("Audio modules reloaded")
    } catch (error) {
      cleanupResults.push("Module reload failed (requires sudo)")
    }

    // 4. Clear any stuck ALSA states
    try {
      await executeCommand("amixer", ["-c", "0", "sset", "Master", "0%"])
      await executeCommand("amixer", ["-c", "0", "sset", "Master", "50%"])
      cleanupResults.push("ALSA mixer reset")
    } catch (error) {
      cleanupResults.push("Mixer reset failed")
    }

    // 5. Final status check
    try {
      const { stdout: finalStatus } = await executeCommand("pgrep", ["-f", "aplay"])
      cleanupResults.push(`Final check: ${finalStatus.trim() || "No aplay processes"}`)
    } catch (error) {
      cleanupResults.push("Final check failed")
    }

    return NextResponse.json({
      success: true,
      message: "Aggressive cleanup completed",
      results: cleanupResults,
    })
  } catch (error) {
    console.error("Cleanup error:", error)
    return NextResponse.json(
      {
        error: "Cleanup failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
