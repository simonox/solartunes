import { GET } from "@/app/api/files/route"
import jest from "jest"

// Mock fs/promises
jest.mock("fs/promises", () => ({
  readdir: jest.fn(),
}))

// Mock path and os
jest.mock("path", () => ({
  join: jest.fn((...args) => args.join("/")),
}))

jest.mock("os", () => ({
  homedir: jest.fn(() => "/home/testuser"),
}))

const mockReaddir = require("fs/promises").readdir as jest.MockedFunction<any>

describe("/api/files", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    console.log = jest.fn()
    console.error = jest.fn()
  })

  describe("GET", () => {
    it("should return list of WAV files", async () => {
      const mockFiles = [
        "song1.wav",
        "song2.WAV",
        "song3.mp3", // Should be filtered out
        "song4.wav",
        "document.txt", // Should be filtered out
      ]

      mockReaddir.mockResolvedValue(mockFiles)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.files).toHaveLength(3)
      expect(data.files[0]).toEqual({
        name: "song1.wav",
        path: "/home/testuser/Music/song1.wav",
      })
      expect(data.files[1]).toEqual({
        name: "song2.WAV",
        path: "/home/testuser/Music/song2.WAV",
      })
      expect(data.files[2]).toEqual({
        name: "song4.wav",
        path: "/home/testuser/Music/song4.wav",
      })
    })

    it("should return empty array when no WAV files found", async () => {
      const mockFiles = ["document.txt", "image.jpg", "video.mp4"]
      mockReaddir.mockResolvedValue(mockFiles)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.files).toHaveLength(0)
    })

    it("should handle directory read error", async () => {
      mockReaddir.mockRejectedValue(new Error("Directory not found"))

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.files).toEqual([])
      expect(data.error).toBe("Failed to list files")
      expect(data.details).toBe("Directory not found")
    })

    it("should handle empty directory", async () => {
      mockReaddir.mockResolvedValue([])

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.files).toEqual([])
    })
  })
})
