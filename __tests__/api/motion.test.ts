import { GET, POST } from "@/app/api/motion/route"
import { NextRequest } from "next/server"
import jest from "jest"

// Mock fs/promises
jest.mock("fs/promises", () => ({
  readFile: jest.fn(),
  writeFile: jest.fn(),
}))

// Mock path and os
jest.mock("path", () => ({
  join: jest.fn((...args) => args.join("/")),
}))

jest.mock("os", () => ({
  homedir: jest.fn(() => "/home/testuser"),
}))

const mockReadFile = require("fs/promises").readFile as jest.MockedFunction<any>
const mockWriteFile = require("fs/promises").writeFile as jest.MockedFunction<any>

// Mock fetch for API calls
global.fetch = jest.fn()

describe("/api/motion", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    console.log = jest.fn()
    console.error = jest.fn()
    mockWriteFile.mockResolvedValue(undefined)
  })

  describe("GET", () => {
    it("should return motion settings from config file", async () => {
      const mockConfig = {
        enabled: true,
        selectedFile: "test.wav",
        lastSaved: "2024-01-01T10:00:00.000Z",
      }

      mockReadFile.mockResolvedValue(JSON.stringify(mockConfig))

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.enabled).toBe(true)
      expect(data.selectedFile).toBe("test.wav")
      expect(data.timestamp).toBeDefined()
    })

    it("should return default settings when config file not found", async () => {
      mockReadFile.mockRejectedValue(new Error("File not found"))

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.enabled).toBe(false)
      expect(data.selectedFile).toBe(null)
    })

    it("should handle config file read error", async () => {
      mockReadFile.mockRejectedValue(new Error("Permission denied"))

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.enabled).toBe(false)
    })
  })

  describe("POST", () => {
    it("should toggle motion detection", async () => {
      mockReadFile.mockResolvedValue(
        JSON.stringify({
          enabled: false,
          selectedFile: "test.wav",
        }),
      )

      const request = new NextRequest("http://localhost:3000/api/motion", {
        method: "POST",
        body: JSON.stringify({ action: "toggle" }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.enabled).toBe(true)
      expect(mockWriteFile).toHaveBeenCalled()
    })

    it("should set motion file", async () => {
      mockReadFile.mockResolvedValue(
        JSON.stringify({
          enabled: false,
          selectedFile: null,
        }),
      )

      const request = new NextRequest("http://localhost:3000/api/motion", {
        method: "POST",
        body: JSON.stringify({ action: "setFile", fileName: "new-file.wav" }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.selectedFile).toBe("new-file.wav")
    })

    it("should trigger motion detection", async () => {
      mockReadFile.mockResolvedValue(
        JSON.stringify({
          enabled: true,
          selectedFile: "test.wav",
        }),
      )

      // Mock child_process for status check
      jest.doMock("child_process", () => ({
        exec: jest.fn(),
      }))

      jest.doMock("util", () => ({
        promisify: jest.fn((fn) => fn),
      }))

      const mockExec = require("child_process").exec as jest.MockedFunction<any>
      mockExec.mockResolvedValue({ stdout: "" }) // No aplay processes

      // Mock successful API call
      const mockFetch = global.fetch as jest.MockedFunction<any>
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })

      const request = new NextRequest("http://localhost:3000/api/motion", {
        method: "POST",
        body: JSON.stringify({ action: "triggerMotion" }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.motionCount).toBe(1)
    })

    it("should handle motion trigger when audio is already playing", async () => {
      mockReadFile.mockResolvedValue(
        JSON.stringify({
          enabled: true,
          selectedFile: "test.wav",
        }),
      )

      // Mock child_process
      jest.doMock("child_process", () => ({
        exec: jest.fn(),
      }))

      jest.doMock("util", () => ({
        promisify: jest.fn((fn) => fn),
      }))

      const mockExec = require("child_process").exec as jest.MockedFunction<any>
      mockExec.mockResolvedValue({ stdout: "1234\n5678" }) // aplay processes running

      const request = new NextRequest("http://localhost:3000/api/motion", {
        method: "POST",
        body: JSON.stringify({ action: "triggerMotion" }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toContain("audio already playing")
    })

    it("should handle invalid action", async () => {
      const request = new NextRequest("http://localhost:3000/api/motion", {
        method: "POST",
        body: JSON.stringify({ action: "invalid" }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it("should handle request parsing error", async () => {
      const request = new NextRequest("http://localhost:3000/api/motion", {
        method: "POST",
        body: "invalid json",
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe("Failed to update motion settings")
    })
  })
})
