import { GET } from "@/app/api/status/route"
import jest from "jest"

// Mock child_process
jest.mock("child_process", () => ({
  exec: jest.fn(),
}))

jest.mock("util", () => ({
  promisify: jest.fn((fn) => fn),
}))

const mockExec = require("child_process").exec as jest.MockedFunction<any>

describe("/api/status", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    console.log = jest.fn()
    console.error = jest.fn()
  })

  describe("GET", () => {
    it("should return playing status when aplay processes are active", async () => {
      mockExec
        .mockResolvedValueOnce({ stdout: "1234\n5678" }) // pgrep finds PIDs
        .mockResolvedValueOnce({ stdout: "S" }) // PID 1234 state
        .mockResolvedValueOnce({ stdout: "R" }) // PID 5678 state
        .mockResolvedValueOnce({ stdout: "state: RUNNING" }) // ALSA status
        .mockResolvedValueOnce({ stdout: "aplay 1234 /dev/snd/pcm" }) // lsof

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.playing).toBe(true)
      expect(data.processInfo).toContain("Active PIDs: 1234, 5678")
      expect(data.debugInfo).toContain("Found 2 active aplay processes")
    })

    it("should return not playing when no aplay processes found", async () => {
      mockExec
        .mockRejectedValueOnce(new Error("No processes found")) // pgrep fails
        .mockResolvedValueOnce({ stdout: "state: SETUP" }) // ALSA not running
        .mockResolvedValueOnce({ stdout: "" }) // lsof empty

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.playing).toBe(false)
      expect(data.debugInfo).toContain("pgrep found no aplay processes")
    })

    it("should detect stuck processes via ALSA status", async () => {
      mockExec
        .mockResolvedValueOnce({ stdout: "1234" }) // pgrep finds PID
        .mockResolvedValueOnce({ stdout: "Z" }) // PID is zombie
        .mockResolvedValueOnce({ stdout: "state: SETUP" }) // ALSA not running
        .mockResolvedValueOnce({ stdout: "" }) // lsof empty

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.playing).toBe(false)
      expect(data.processInfo).toContain("Stuck processes detected")
      expect(data.debugInfo).toContain("All aplay processes are zombies/dead")
    })

    it("should trust ALSA over process list when ALSA shows running", async () => {
      mockExec
        .mockRejectedValueOnce(new Error("No processes")) // pgrep fails
        .mockResolvedValueOnce({ stdout: "state: RUNNING" }) // ALSA running
        .mockResolvedValueOnce({ stdout: "aplay using device" }) // lsof confirms

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.playing).toBe(true)
      expect(data.processInfo).toBe("ALSA shows active playback")
    })

    it("should handle all command failures gracefully", async () => {
      mockExec.mockRejectedValue(new Error("Command failed"))

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.playing).toBe(false)
      expect(data.debugInfo).toContain("pgrep found no aplay processes")
      expect(data.debugInfo).toContain("ALSA check failed")
      expect(data.debugInfo).toContain("lsof check failed")
    })

    it("should include timestamp in response", async () => {
      mockExec.mockRejectedValue(new Error("No processes"))

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.timestamp).toBeDefined()
      expect(new Date(data.timestamp)).toBeInstanceOf(Date)
    })

    it("should handle general error", async () => {
      mockExec.mockImplementation(() => {
        throw new Error("System error")
      })

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.playing).toBe(false)
      expect(data.error).toBe("Status check failed")
      expect(data.details).toBe("System error")
    })
  })
})
