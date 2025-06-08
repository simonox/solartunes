import { POST } from "@/app/api/stop/route"
import jest from "jest"

// Mock child_process
jest.mock("child_process", () => ({
  exec: jest.fn(),
}))

jest.mock("util", () => ({
  promisify: jest.fn((fn) => fn),
}))

const mockExec = require("child_process").exec as jest.MockedFunction<any>

describe("/api/stop", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    console.log = jest.fn()
    console.error = jest.fn()
  })

  describe("POST", () => {
    it("should stop audio playback successfully", async () => {
      mockExec
        .mockResolvedValueOnce({ stdout: "1234\n5678" }) // pgrep finds PIDs
        .mockResolvedValueOnce({ stdout: "" }) // kill TERM 1234
        .mockRejectedValueOnce(new Error("No such process")) // kill -0 1234 (process dead)
        .mockResolvedValueOnce({ stdout: "" }) // kill TERM 5678
        .mockRejectedValueOnce(new Error("No such process")) // kill -0 5678 (process dead)
        .mockResolvedValueOnce({ stdout: "" }) // pkill
        .mockResolvedValueOnce({ stdout: "" }) // killall
        .mockResolvedValueOnce({ stdout: "state: SETUP" }) // ALSA status
        .mockResolvedValueOnce({ stdout: "" }) // final check

      const response = await POST()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe("Playback stopped and processes cleaned up")
    })

    it("should force kill stubborn processes", async () => {
      mockExec
        .mockResolvedValueOnce({ stdout: "1234" }) // pgrep finds PID
        .mockResolvedValueOnce({ stdout: "" }) // kill TERM 1234
        .mockResolvedValueOnce({ stdout: "" }) // kill -0 1234 (still running)
        .mockResolvedValueOnce({ stdout: "" }) // kill KILL 1234
        .mockResolvedValueOnce({ stdout: "" }) // pkill
        .mockResolvedValueOnce({ stdout: "" }) // killall
        .mockResolvedValueOnce({ stdout: "state: SETUP" }) // ALSA status
        .mockResolvedValueOnce({ stdout: "" }) // final check

      const response = await POST()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(console.log).toHaveBeenCalledWith("Force killed PID 1234")
    })

    it("should handle no processes to kill", async () => {
      mockExec
        .mockResolvedValueOnce({ stdout: "" }) // pgrep finds no PIDs
        .mockRejectedValueOnce(new Error("No processes")) // pkill fails
        .mockRejectedValueOnce(new Error("No processes")) // killall fails
        .mockResolvedValueOnce({ stdout: "state: SETUP" }) // ALSA status
        .mockResolvedValueOnce({ stdout: "" }) // final check

      const response = await POST()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(console.log).toHaveBeenCalledWith("No aplay processes found to kill")
    })

    it("should reset ALSA when still showing as running", async () => {
      mockExec
        .mockResolvedValueOnce({ stdout: "" }) // no processes
        .mockRejectedValueOnce(new Error("No processes")) // pkill
        .mockRejectedValueOnce(new Error("No processes")) // killall
        .mockResolvedValueOnce({ stdout: "state: RUNNING" }) // ALSA still running
        .mockResolvedValueOnce({ stdout: "" }) // amixer mute
        .mockResolvedValueOnce({ stdout: "" }) // amixer unmute
        .mockResolvedValueOnce({ stdout: "" }) // final check

      const response = await POST()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(console.log).toHaveBeenCalledWith("ALSA still showing as running, attempting reset...")
    })

    it("should warn about remaining processes", async () => {
      mockExec
        .mockResolvedValueOnce({ stdout: "1234" }) // pgrep finds PID
        .mockRejectedValueOnce(new Error("Kill failed")) // kill fails
        .mockRejectedValueOnce(new Error("No processes")) // pkill
        .mockRejectedValueOnce(new Error("No processes")) // killall
        .mockResolvedValueOnce({ stdout: "state: SETUP" }) // ALSA status
        .mockResolvedValueOnce({ stdout: "1234" }) // final check still shows process

      const response = await POST()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(console.log).toHaveBeenCalledWith("Warning: Some aplay processes may still be running: 1234")
    })

    it("should handle system errors gracefully", async () => {
      mockExec.mockRejectedValue(new Error("System error"))

      const response = await POST()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe("Failed to stop playback")
      expect(data.details).toBe("System error")
    })

    it("should handle individual command failures", async () => {
      mockExec
        .mockRejectedValueOnce(new Error("pgrep failed"))
        .mockRejectedValueOnce(new Error("pkill failed"))
        .mockRejectedValueOnce(new Error("killall failed"))
        .mockRejectedValueOnce(new Error("ALSA check failed"))
        .mockRejectedValueOnce(new Error("final check failed"))

      const response = await POST()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(console.log).toHaveBeenCalledWith("PID-based killing failed:", expect.any(Error))
    })
  })
})
