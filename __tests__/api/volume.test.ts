import { GET, POST } from "@/app/api/volume/route"
import { NextRequest } from "next/server"
import jest from "jest"

// Mock child_process
jest.mock("child_process", () => ({
  exec: jest.fn(),
}))

jest.mock("util", () => ({
  promisify: jest.fn((fn) => fn),
}))

const mockExec = require("child_process").exec as jest.MockedFunction<any>

describe("/api/volume", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    console.log = jest.fn()
    console.error = jest.fn()
  })

  describe("GET", () => {
    it("should return current volume from percentage format", async () => {
      mockExec.mockResolvedValue({
        stdout:
          "Simple mixer control 'Digital',0\n  Capabilities: pvolume\n  Playback channels: Front Left - Front Right\n  Limits: Playback 0 - 207\n  Front Left: Playback 104 [50%] [on]\n  Front Right: Playback 104 [50%] [on]",
      })

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.volume).toBe(50)
    })

    it("should return volume from absolute values when percentage not available", async () => {
      mockExec.mockResolvedValue({
        stdout:
          "Simple mixer control 'Digital',0\n  Capabilities: pvolume\n  Playback channels: Front Left - Front Right\n  Limits: Playback 0 - 207\n  Front Left: Playback 104 [104/207] [on]\n  Front Right: Playback 104 [104/207] [on]",
      })

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.volume).toBe(50) // 104/207 ≈ 50%
    })

    it("should return default volume when parsing fails", async () => {
      mockExec.mockResolvedValue({
        stdout: "No volume information available",
      })

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.volume).toBe(50) // Default volume
    })

    it("should handle amixer command failure", async () => {
      mockExec.mockRejectedValue(new Error("amixer not found"))

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.volume).toBe(50) // Default volume
    })
  })

  describe("POST", () => {
    it("should set volume successfully", async () => {
      mockExec.mockResolvedValue({ stdout: "", stderr: "" })

      const request = new NextRequest("http://localhost:3000/api/volume", {
        method: "POST",
        body: JSON.stringify({ volume: 75 }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.volume).toBe(75)
      expect(mockExec).toHaveBeenCalledWith("amixer -c 0 sset 'Digital' 75%")
    })

    it("should reject volume below 0", async () => {
      const request = new NextRequest("http://localhost:3000/api/volume", {
        method: "POST",
        body: JSON.stringify({ volume: -10 }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("Invalid volume level. Must be between 0 and 100.")
    })

    it("should reject volume above 100", async () => {
      const request = new NextRequest("http://localhost:3000/api/volume", {
        method: "POST",
        body: JSON.stringify({ volume: 150 }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("Invalid volume level. Must be between 0 and 100.")
    })

    it("should reject undefined volume", async () => {
      const request = new NextRequest("http://localhost:3000/api/volume", {
        method: "POST",
        body: JSON.stringify({}),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("Invalid volume level. Must be between 0 and 100.")
    })

    it("should handle amixer command failure", async () => {
      mockExec.mockRejectedValue(new Error("amixer failed"))

      const request = new NextRequest("http://localhost:3000/api/volume", {
        method: "POST",
        body: JSON.stringify({ volume: 50 }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe("Failed to set volume")
      expect(data.details).toBe("amixer failed")
      expect(data.command).toBe("amixer -c 0 sset 'Digital' 50%")
    })

    it("should handle invalid JSON in request", async () => {
      const request = new NextRequest("http://localhost:3000/api/volume", {
        method: "POST",
        body: "invalid json",
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe("Failed to process volume request")
    })

    it("should accept volume at boundaries", async () => {
      mockExec.mockResolvedValue({ stdout: "", stderr: "" })

      // Test volume 0
      let request = new NextRequest("http://localhost:3000/api/volume", {
        method: "POST",
        body: JSON.stringify({ volume: 0 }),
      })

      let response = await POST(request)
      let data = await response.json()

      expect(response.status).toBe(200)
      expect(data.volume).toBe(0)

      // Test volume 100
      request = new NextRequest("http://localhost:3000/api/volume", {
        method: "POST",
        body: JSON.stringify({ volume: 100 }),
      })

      response = await POST(request)
      data = await response.json()

      expect(response.status).toBe(200)
      expect(data.volume).toBe(100)
    })
  })
})
