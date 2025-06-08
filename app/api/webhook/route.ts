import { NextResponse } from "next/server"
import { writeFile } from "fs/promises"
import { join } from "path"
import { readdir } from "fs/promises"

const WEBHOOK_CONFIG_FILE = join(process.cwd(), "config/webhook.json")
const SCRIPTS_DIR = join(process.cwd(), "Music")

async function getAvailableScripts(): Promise<{ name: string }[]> {
  try {
    const files = await readdir(SCRIPTS_DIR)
    return files.filter((file) => file.endsWith(".sh")).map((file) => ({ name: file }))
  } catch (error) {
    console.error("Error reading scripts directory:", error)
    return []
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (body.action === "save") {
      const selectedScript = body.selectedScript || ""

      // Handle "defaultScript" or empty selection as disabled webhook
      if (selectedScript === "defaultScript" || selectedScript === "") {
        const config = {
          selectedScript: "defaultScript", // Use consistent default value
          lastSaved: new Date().toISOString(),
        }

        await writeFile(WEBHOOK_CONFIG_FILE, JSON.stringify(config, null, 2), "utf-8")
        console.log("Webhook disabled (no script selected)")

        return NextResponse.json({
          success: true,
          selectedScript: "defaultScript",
          lastSaved: config.lastSaved,
          message: "Webhook disabled - no script will execute on motion",
        })
      }

      // Validate that the selected script exists in available scripts
      const availableScripts = await getAvailableScripts()
      const scriptExists = availableScripts.some((script) => script.name === selectedScript)

      if (!scriptExists) {
        return NextResponse.json(
          {
            error: "Selected script is not available or not allowed",
            details: `Script "${selectedScript}" not found in ~/Music directory`,
          },
          { status: 400 },
        )
      }

      // Save valid script selection
      const config = {
        selectedScript,
        lastSaved: new Date().toISOString(),
      }

      await writeFile(WEBHOOK_CONFIG_FILE, JSON.stringify(config, null, 2), "utf-8")
      console.log("Webhook configuration saved:", config)

      return NextResponse.json({
        success: true,
        selectedScript: config.selectedScript,
        lastSaved: config.lastSaved,
        message: `Webhook configured to execute "${selectedScript}" on motion`,
      })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Error updating webhook settings:", error)
    return NextResponse.json(
      {
        error: "Failed to update webhook settings",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
