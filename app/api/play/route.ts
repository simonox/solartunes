import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { fileName } = await request.json()

    if (!fileName) {
      return NextResponse.json({ error: "File name is required" }, { status: 400 })
    }

    // For preview purposes, simulate successful playback
    console.log(`Simulating playback of: ${fileName}`)

    return NextResponse.json({ success: true, message: `Playing ${fileName}` })
  } catch (error) {
    console.error("Error playing file:", error)
    return NextResponse.json(
      {
        error: "Failed to play file",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
