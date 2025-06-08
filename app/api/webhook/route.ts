import { NextResponse } from "next/server"
import { readFile, writeFile } from "fs/promises"
import { join } from "path"
import { homedir } from "os"

// Webhook configuration file path
const WEBHOOK_CONFIG_FILE = join(homedir(), "Music", "webhook.conf")

// Load webhook configuration
async function loadWebhookConfig() {
  try {
    const configData = await readFile(WEBHOOK_CONFIG_FILE, "utf-8")
    return JSON.parse(configData)
  } catch (error) {
    // Config file doesn't exist or is invalid, return default
    return {
      command: "",
      lastSaved: null,
    }
  }
}

// Save webhook configuration
async function saveWebhookConfig(config: any) {
  try {
    const configToSave = {
      command: config.command || "",
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

export async function GET() {
  try {
    const config = await loadWebhookConfig()
    return NextResponse.json({
      success: true,
      ...config,
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
      const savedConfig = await saveWebhookConfig({
        command: body.command || "",
      })

      return NextResponse.json({
        success: true,
        message: "Webhook configuration saved successfully",
        ...savedConfig,
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
