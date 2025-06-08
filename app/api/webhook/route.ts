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
      selectedScript: "defaultScript",
      lastSaved: null,
    }
  }
}

// Save webhook configuration
async function saveWebhookConfig(config: any) {
  try {
    const configToSave = {
      selectedScript: config.selectedScript || "defaultScript",
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

// GET method - Fetch webhook configuration and available scripts
export async function GET() {
  try {
    console.log("GET /api/webhook - Fetching webhook configuration and available scripts")

    const config = await loadWebhookConfig()
    const availableScripts = await getAvailableScripts()

    console.log(`Found ${availableScripts.length} available scripts`)
    console.log("Current webhook config:", config)

    return NextResponse.json({
      success: true,
      selectedScript: config.selectedScript || "defaultScript",
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

// POST method - Save webhook configuration
export async function POST(request: Request) {
  try {
    console.log("POST /api/webhook - Saving webhook configuration")

    const body = await request.json()
    console.log("Request body:", body)

    if (body.action === "save") {
      const selectedScript = body.selectedScript || "defaultScript"

      // Handle "defaultScript" or empty selection as disabled webhook
      if (selectedScript === "defaultScript" || selectedScript === "") {
        const savedConfig = await saveWebhookConfig({
          selectedScript: "defaultScript",
        })

        console.log("Webhook disabled (no script selected)")

        return NextResponse.json({
          success: true,
          selectedScript: "defaultScript",
          lastSaved: savedConfig.lastSaved,
          message: "Webhook disabled - no script will execute on motion",
          timestamp: new Date().toISOString(),
        })
      }

      // Validate that the selected script exists and is in the allowed directory
      const availableScripts = await getAvailableScripts()
      const scriptExists = availableScripts.some((script) => script.name === selectedScript)

      if (!scriptExists) {
        console.error(`Script "${selectedScript}" not found in available scripts`)
        return NextResponse.json(
          {
            error: "Selected script is not available or not allowed",
            details: `Script "${selectedScript}" not found in ~/Music directory`,
          },
          { status: 400 },
        )
      }

      // Save valid script selection
      const savedConfig = await saveWebhookConfig({
        selectedScript,
      })

      console.log("Webhook configuration saved successfully:", savedConfig)

      return NextResponse.json({
        success: true,
        selectedScript: savedConfig.selectedScript,
        lastSaved: savedConfig.lastSaved,
        message: `Webhook configured to execute "${selectedScript}" on motion`,
        timestamp: new Date().toISOString(),
      })
    } else {
      console.error("Invalid action:", body.action)
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

// OPTIONS method - Handle CORS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  })
}
