/**
 * Integration tests for API routes
 * These tests verify that routes work together correctly
 */

import { GET as getFiles } from "@/app/api/files/route"
import { POST as playFile } from "@/app/api/play/route"
import { GET as getStatus } from "@/app/api/status/route"
import { POST as stopPlayback } from "@/app/api/stop/route"
import { createMockRequest } from "../setup/test-utils"
import jest from "jest"

// Mock all the dependencies
jest.mock("fs/promises")
jest.mock("child_process")
jest.mock("util")
jest.mock("path")
jest.mock("os")

const mockReaddir = require("fs/promises").readdir as jest.MockedFunction<any>
const mockAccess = require("fs/promises").access as jest.MockedFunction<any>
const mockSpawn = require("child_process").spawn as jest.MockedFunction<any>
const mockExec = require("child_process").exec as jest.MockedFunction<any>

// Mock process for spawn
class MockProcess {
  pid = 1234
  stderr = { on: jest.fn() }
  stdout = { on: jest.fn() }
  on = jest.fn()
  kill = jest.fn()
  unref = jest.fn()
}

describe("API Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    console.log = jest.fn()
    console.error = jest.fn()
  })

  describe("File listing and playback workflow", () => {
    it("should list files, play a file, check status, and stop", async () => {
      // Step 1: List files
      mockReaddir.mockResolvedValue(["song1.wav", "song2.wav", "document.txt"])

      const filesResponse = await getFiles()
      const filesData = await filesResponse.json()

      expect(filesData.files).toHaveLength(2)
      expect(filesData.files[0].name).toBe("song1.wav")

      // Step 2: Play a file
      const mockProcess = new MockProcess()
      mockSpawn.mockReturnValue(mockProcess)
      mockAccess.mockResolvedValue(undefined) // File exists

      const playRequest = createMockRequest("http://localhost:3000/api/play", {
        method: "POST",
        body: { fileName: "song1.wav" },
      })

      const playResponse = await playFile(playRequest)
      const playData = await playResponse.json()

      expect(playData.success).toBe(true)
      expect(playData.message).toBe("Playing song1.wav")

      // Step 3: Check status (should show playing)
      mockExec
        .mockResolvedValueOnce({ stdout: "1234" }) // pgrep finds PID
        .mockResolvedValueOnce({ stdout: "S" }) // PID state
        .mockResolvedValueOnce({ stdout: "state: RUNNING" }) // ALSA status
        .mockResolvedValueOnce({ stdout: "aplay using device" }) // lsof

      const statusResponse = await getStatus()
      const statusData = await statusResponse.json()

      expect(statusData.playing).toBe(true)

      // Step 4: Stop playback
      mockExec
        .mockResolvedValueOnce({ stdout: "1234" }) // pgrep finds PID
        .mockResolvedValueOnce({ stdout: "" }) // kill TERM
        .mockRejectedValueOnce(new Error("No such process")) // kill -0 (process dead)
        .mockResolvedValueOnce({ stdout: "" }) // pkill
        .mockResolvedValueOnce({ stdout: "" }) // killall
        .mockResolvedValueOnce({ stdout: "state: SETUP" }) // ALSA status
        .mockResolvedValueOnce({ stdout: "" }) // final check

      const stopResponse = await stopPlayback()
      const stopData = await stopResponse.json()

      expect(stopData.success).toBe(true)
    })
  })

  describe("Error handling across routes", () => {
    it("should handle file not found gracefully across play and status", async () => {
      // Try to play non-existent file
      mockAccess.mockRejectedValue(new Error("File not found"))

      const playRequest = createMockRequest("http://localhost:3000/api/play", {
        method: "POST",
        body: { fileName: "nonexistent.wav" },
      })

      const playResponse = await playFile(playRequest)
      const playData = await playResponse.json()

      expect(playResponse.status).toBe(404)
      expect(playData.error).toBe("File not found")

      // Status should show not playing
      mockExec.mockRejectedValue(new Error("No processes"))

      const statusResponse = await getStatus()
      const statusData = await statusResponse.json()

      expect(statusData.playing).toBe(false)
    })
  })
})
