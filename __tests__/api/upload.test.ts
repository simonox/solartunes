import { POST } from "@/app/api/upload/route"
import { NextRequest } from "next/server"
import jest from "jest"

// Mock fs/promises
jest.mock("fs/promises", () => ({
  writeFile: jest.fn(),
  mkdir: jest.fn(),
}))

// Mock child_process
jest.mock("child_process", () => ({
  exec: jest.fn(),
}))

// Mock path and os
jest.mock("path", () => ({
  join: jest.fn((...args) => args.join("/")),
}))

jest.mock("os", () => ({
  homedir: jest.fn(() => "/home/testuser"),
}))

jest.mock("util", () => ({
  promisify: jest.fn((fn) => fn),
}))

const mockWriteFile = require("fs/promises").writeFile as jest.MockedFunction<any>
const mockMkdir = require("fs/promises").mkdir as jest.MockedFunction<any>
const mockExec = require("child_process").exec as jest.MockedFunction<any>

// Mock File object
class MockFile {
  constructor(
    public name: string,
    public type = "audio/wav",
    public size = 1024,
  ) {}

  async arrayBuffer() {
    return new ArrayBuffer(this.size)
  }
}

describe("/api/upload", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    console.log = jest.fn()
    console.error = jest.fn()
    mockWriteFile.mockResolvedValue(undefined)
    mockMkdir.mockResolvedValue(undefined)
  })

  describe("POST", () => {
    it("should upload and process WAV file successfully", async () => {
      const mockFile = new MockFile("test.wav")
      const formData = new FormData()
      formData.append("file", mockFile as any)

      mockExec
        .mockResolvedValueOnce({ stdout: "", stderr: "ffmpeg processing..." }) // ffmpeg
        .mockResolvedValueOnce({ stdout: "" }) // rm temp file

      const request = new NextRequest("http://localhost:3000/api/upload", {
        method: "POST",
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe("File uploaded and processed successfully")
      expect(data.fileName).toMatch(/^test_\d+\.wav$/)
      expect(data.originalName).toBe("test.wav")
    })

    it("should reject non-WAV files", async () => {
      const mockFile = new MockFile("test.mp3", "audio/mp3")
      const formData = new FormData()
      formData.append("file", mockFile as any)

      const request = new NextRequest("http://localhost:3000/api/upload", {
        method: "POST",
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("Only WAV files are accepted")
    })

    it("should handle missing file", async () => {
      const formData = new FormData()

      const request = new NextRequest("http://localhost:3000/api/upload", {
        method: "POST",
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("No file provided")
    })

    it("should handle case-insensitive WAV extension", async () => {
      const mockFile = new MockFile("test.WAV")
      const formData = new FormData()
      formData.append("file", mockFile as any)

      mockExec.mockResolvedValueOnce({ stdout: "", stderr: "" }).mockResolvedValueOnce({ stdout: "" })

      const request = new NextRequest("http://localhost:3000/api/upload", {
        method: "POST",
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it("should handle ffmpeg processing failure", async () => {
      const mockFile = new MockFile("test.wav")
      const formData = new FormData()
      formData.append("file", mockFile as any)

      mockExec.mockRejectedValueOnce(new Error("ffmpeg failed")).mockResolvedValueOnce({ stdout: "" }) // cleanup temp file

      const request = new NextRequest("http://localhost:3000/api/upload", {
        method: "POST",
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe("Failed to process audio file")
      expect(data.details).toBe("ffmpeg failed")
    })

    it("should create music directory if it does not exist", async () => {
      const mockFile = new MockFile("test.wav")
      const formData = new FormData()
      formData.append("file", mockFile as any)

      mockExec.mockResolvedValueOnce({ stdout: "", stderr: "" }).mockResolvedValueOnce({ stdout: "" })

      const request = new NextRequest("http://localhost:3000/api/upload", {
        method: "POST",
        body: formData,
      })

      await POST(request)

      expect(mockMkdir).toHaveBeenCalledWith("/home/testuser/Music", { recursive: true })
    })

    it("should handle file write error", async () => {
      const mockFile = new MockFile("test.wav")
      const formData = new FormData()
      formData.append("file", mockFile as any)

      mockWriteFile.mockRejectedValue(new Error("Disk full"))

      const request = new NextRequest("http://localhost:3000/api/upload", {
        method: "POST",
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe("Failed to upload file")
      expect(data.details).toBe("Disk full")
    })

    it("should clean up temp file on ffmpeg failure", async () => {
      const mockFile = new MockFile("test.wav")
      const formData = new FormData()
      formData.append("file", mockFile as any)

      mockExec.mockRejectedValueOnce(new Error("ffmpeg failed")).mockResolvedValueOnce({ stdout: "" }) // cleanup

      const request = new NextRequest("http://localhost:3000/api/upload", {
        method: "POST",
        body: formData,
      })

      await POST(request)

      // Should call rm to cleanup temp file
      expect(mockExec).toHaveBeenCalledWith(expect.stringMatching(/^rm ".*test_temp_\d+\.wav"$/))
    })

    it("should handle cleanup failure gracefully", async () => {
      const mockFile = new MockFile("test.wav")
      const formData = new FormData()
      formData.append("file", mockFile as any)

      mockExec.mockRejectedValueOnce(new Error("ffmpeg failed")).mockRejectedValueOnce(new Error("cleanup failed"))

      const request = new NextRequest("http://localhost:3000/api/upload", {
        method: "POST",
        body: formData,
      })

      const response = await POST(request)

      expect(response.status).toBe(500)
      expect(console.warn).toHaveBeenCalledWith("Failed to cleanup temp file after error:", expect.any(Error))
    })

    it("should generate unique filenames with timestamp", async () => {
      const mockFile = new MockFile("test.wav")
      const formData = new FormData()
      formData.append("file", mockFile as any)

      // Mock Date.now to return predictable timestamp
      const mockTimestamp = 1640995200000 // 2022-01-01 00:00:00
      jest.spyOn(Date, "now").mockReturnValue(mockTimestamp)

      mockExec.mockResolvedValueOnce({ stdout: "", stderr: "" }).mockResolvedValueOnce({ stdout: "" })

      const request = new NextRequest("http://localhost:3000/api/upload", {
        method: "POST",
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data.fileName).toBe(`test_${mockTimestamp}.wav`)

      // Restore Date.now
      jest.restoreAllMocks()
    })
  })
})
