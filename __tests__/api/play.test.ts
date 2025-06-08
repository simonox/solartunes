import { POST } from "@/app/api/play/route"
import { NextRequest } from "next/server"
import jest from "jest"

// Mock child_process
jest.mock("child_process", () => ({
  spawn: jest.fn(),
}))

// Mock fs/promises
jest.mock("fs/promises", () => ({
  access: jest.fn(),
}))

// Mock path and os
jest.mock("path", () => ({
  join: jest.fn((...args) => args.join("/")),
}))

jest.mock("os", () => ({
  homedir: jest.fn(() => "/home/testuser"),
}))

const mockSpawn = require("child_process").spawn as jest.MockedFunction<any>
const mockAccess = require("fs/promises").access as jest.MockedFunction<any>

// Mock EventEmitter for process
class MockProcess {
  pid = 1234
  stderr = { on: jest.fn() }
  stdout = { on: jest.fn() }
  on = jest.fn()
  kill = jest.fn()
  unref = jest.fn()
}

describe("/api/play", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    console.log = jest.fn()
    console.error = jest.fn()
  })

  describe("POST", () => {
    it("should start playing audio file successfully", async () => {
      const mockProcess = new MockProcess()
      mockSpawn.mockReturnValue(mockProcess)
      mockAccess.mockResolvedValue(undefined) // File exists

      const request = new NextRequest("http://localhost:3000/api/play", {
        method: "POST",
        body: JSON.stringify({ fileName: "test.wav" }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe("Playing test.wav")
      expect(data.pid).toBe(1234)
      expect(mockSpawn).toHaveBeenCalledWith(
        "aplay",
        ["-D", "hw:0,0", "/home/testuser/Music/test.wav"],
        expect.objectContaining({
          detached: true,
          stdio: ["ignore", "pipe", "pipe"],
        }),
      )
    })

    it("should return error when fileName is missing", async () => {
      const request = new NextRequest("http://localhost:3000/api/play", {
        method: "POST",
        body: JSON.stringify({}),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("File name is required")
    })

    it("should return error when file does not exist", async () => {
      mockAccess.mockRejectedValue(new Error("File not found"))

      const request = new NextRequest("http://localhost:3000/api/play", {
        method: "POST",
        body: JSON.stringify({ fileName: "nonexistent.wav" }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe("File not found")
    })

    it("should kill previous process before starting new one", async () => {
      const oldProcess = new MockProcess()
      const newProcess = new MockProcess()

      // First call returns old process, second call returns new process
      mockSpawn.mockReturnValueOnce(oldProcess).mockReturnValueOnce(newProcess)
      mockAccess.mockResolvedValue(undefined)

      // First request
      const request1 = new NextRequest("http://localhost:3000/api/play", {
        method: "POST",
        body: JSON.stringify({ fileName: "test1.wav" }),
      })

      await POST(request1)

      // Second request should kill the first process
      const request2 = new NextRequest("http://localhost:3000/api/play", {
        method: "POST",
        body: JSON.stringify({ fileName: "test2.wav" }),
      })

      const response = await POST(request2)
      const data = await response.json()

      expect(oldProcess.kill).toHaveBeenCalledWith("SIGTERM")
      expect(response.status).toBe(200)
      expect(data.message).toBe("Playing test2.wav")
    })

    it("should handle spawn error", async () => {
      mockSpawn.mockImplementation(() => {
        throw new Error("Spawn failed")
      })
      mockAccess.mockResolvedValue(undefined)

      const request = new NextRequest("http://localhost:3000/api/play", {
        method: "POST",
        body: JSON.stringify({ fileName: "test.wav" }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe("Failed to play file")
      expect(data.details).toBe("Spawn failed")
    })

    it("should handle process exit events", async () => {
      const mockProcess = new MockProcess()
      mockSpawn.mockReturnValue(mockProcess)
      mockAccess.mockResolvedValue(undefined)

      const request = new NextRequest("http://localhost:3000/api/play", {
        method: "POST",
        body: JSON.stringify({ fileName: "test.wav" }),
      })

      await POST(request)

      // Simulate process exit
      const exitCallback = mockProcess.on.mock.calls.find((call) => call[0] === "exit")?.[1]
      expect(exitCallback).toBeDefined()

      // Test successful exit
      exitCallback(0, null)
      expect(console.log).toHaveBeenCalledWith("Successfully finished playing test.wav")

      // Test error exit
      exitCallback(1, null)
      expect(console.error).toHaveBeenCalledWith("aplay failed with error code 1 for test.wav")
    })

    it("should handle invalid JSON in request", async () => {
      const request = new NextRequest("http://localhost:3000/api/play", {
        method: "POST",
        body: "invalid json",
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe("Failed to play file")
    })
  })
})
