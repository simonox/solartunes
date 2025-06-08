import { NextResponse } from "next/server"
import { readFile, writeFile, readdir } from "fs/promises"
import { join } from "path"
import { homedir } from "os"
import { stat } from "fs/promises"

// Webhook configuration file path
const WEBHOOK_CONFIG_FILE = join(homedir(), "Music", "webhook.conf")
const SCRIPTS_DIRECTORY = join(homedir(), "Music")

// Load webhook configuration
async function loadWebhookConfig() {
  try {
    const configData = await readFile(WEBHOOK_CONFIG_FILE, "utf-8")
    return JSON.parse(configData)
  } catch (error) {
    // Config file doesn't exist or is invalid, return default
    return {
      selectedScript: "",
      lastSaved: null,
    }
  }
}

// Save webhook configuration
async function saveWebhookConfig(config: any) {
  try {
    const configToSave = {
      selectedScript: config.selectedScript || "",
      lastSaved: new Date().toISOString(),
    }

    await writeFile(WEBHOOK_CONFIG_FILE, JSON.stringify(configToSave, null, 2), "utf-8")
    console.log("Webhook configuration saved:", configToSave)
    return configToSave
  } catch (error) {
    console.error("Failed to save webhook configuration:", error)
    throw error
  }
}

// Get available shell scripts from ~/Music directory
async function getAvailableScripts() {
  try {
    const files = await readdir(SCRIPTS_DIRECTORY)
    const scripts = []

    for (const file of files) {
      if (file.endsWith(".sh")) {
        const filePath = join(SCRIPTS_DIRECTORY, file)
        try {
          const stats = await stat(filePath)
          if (stats.isFile()) {
            scripts.push({
              name: file,
              path: filePath,
              size: stats.size,
              modified: stats.mtime.toISOString(),
            })
          }
        } catch (error) {
          console.error(`Error checking script ${file}:`, error)
        }
      }
    }

    return scripts.sort((a, b) => a.name.localeCompare(b.name))
  } catch (error) {
    console.error("Failed to read scripts directory:", error)
    return []
  }
}

export async function GET() {
  try {
    const config = await loadWebhookConfig()
    const availableScripts = await getAvailableScripts()

    return NextResponse.json({
      success: true,
      selectedScript: config.selectedScript || "",
      lastSaved: config.lastSaved,
      availableScripts,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error getting webhook config:", error)
    return NextResponse.json(
      {
        error: "Failed to get webhook configuration",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (body.action === "save") {
      // Validate that the selected script exists and is in the allowed directory
      const availableScripts = await getAvailableScripts()
      const selectedScript = body.selectedScript || ""

      if (selectedScript && !availableScripts.some((script) => script.name === selectedScript)) {
        return NextResponse.json({ error: "Selected script is not available or not allowed" }, { status: 400 })
      }

      const savedConfig = await saveWebhookConfig({
        selectedScript,
      })

      return NextResponse.json({
        success: true,
        message: "Webhook configuration saved successfully",
        selectedScript: savedConfig.selectedScript,
        lastSaved: savedConfig.lastSaved,
        timestamp: new Date().toISOString(),
      })
    } else {
      return NextResponse.json({ error: "Invalid action. Use 'save'" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error updating webhook config:", error)
    return NextResponse.json(
      {
        error: "Failed to update webhook configuration",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
