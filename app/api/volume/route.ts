import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import { promises as fs } from "fs";
import path from "path";
import os from "os";

const execAsync = promisify(exec);

// Path to volume.json in ~/Music
const volumeFile = path.join(os.homedir(), "Music", "volume.conf");

// Helper to ensure volume.json exists and read its value
async function getPersistedVolume(): Promise<number> {
  try {
    await fs.access(volumeFile);
    const content = await fs.readFile(volumeFile, "utf-8");
    const obj = JSON.parse(content);
    if (typeof obj.volume === "number") {
      return obj.volume;
    }
  } catch {
    // File missing/corrupt, initialize
    await savePersistedVolume(90);
    return 90;
  }
  // Default fallback
  return 90;
}

// Helper to write volume
async function savePersistedVolume(volume: number) {
  await fs.mkdir(path.dirname(volumeFile), { recursive: true });
  await fs.writeFile(volumeFile, JSON.stringify({ volume }), "utf-8");
}

export async function POST(request: Request) {
  try {
    const { volume } = await request.json();

    if (volume === undefined || volume < 0 || volume > 100) {
      return NextResponse.json({ error: "Invalid volume level. Must be between 0 and 100." }, { status: 400 });
    }

    // Set system volume
    const command = `amixer -c 0 sset 'Digital' ${volume}%`;
    try {
      await execAsync(command);
      // Save to file
      await savePersistedVolume(volume);
      return NextResponse.json({ success: true, volume });
    } catch (error) {
      return NextResponse.json({ error: "Failed to set volume", details: error instanceof Error ? error.message : "Unknown error", command }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ error: "Failed to process volume request", details: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Try to get persisted volume (always)
    const persisted = await getPersistedVolume();
    return NextResponse.json({ volume: persisted });
  } catch (error) {
    return NextResponse.json({ volume: 90 }); // Fallback
  }
}