import { POST } from "@/app/api/cleanup/route"
import jest from "jest"

// Mock child_process
jest.mock("child_process", () => ({
  exec: jest.fn(),
}))

// Mock util
jest.mock("util", () => ({
  promisify: jest.fn((fn) => fn),
}))

const mockExec = require("child_process").exec as jest.MockedFunction<any>

describe("/api/cleanup", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    console.log = jest.fn()
    console.error = jest.fn()
  })

  describe("POST", () => {
    it("should perform cleanup successfully", async () => {
      // Mock successful command executions
      mockExec
        .mockResolvedValueOnce({ stdout: "", stderr: "" }) // pkill
        .mockResolvedValueOnce({ stdout: "", stderr: "" }) // alsactl restore
        .mockResolvedValueOnce({ stdout: "", stderr: "" }) // modprobe
        .mockResolvedValueOnce({ stdout: "", stderr: "" }) // amixer
        .mockResolvedValueOnce({ stdout: "No aplay processes", stderr: "" }) // final check

      const response = await POST()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe("Aggressive cleanup completed")
      expect(data.results).toHaveLength(5)
      expect(data.results).toContain("Killed all audio processes")
    })

    it("should handle partial cleanup failures gracefully", async () => {
      // Mock some commands failing
      mockExec
        .mockRejectedValueOnce(new Error("No processes to kill")) // pkill fails
        .mockResolvedValueOnce({ stdout: "", stderr: "" }) // alsactl succeeds
        .mockRejectedValueOnce(new Error("Permission denied")) // modprobe fails
        .mockResolvedValueOnce({ stdout: "", stderr: "" }) // amixer succeeds
        .mockResolvedValueOnce({ stdout: "No aplay processes", stderr: "" }) // final check

      const response = await POST()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.results).toContain("No audio processes to kill")
      expect(data.results).toContain("Module reload failed (requires sudo)")
    })

    it("should handle complete cleanup failure", async () => {
      mockExec.mockRejectedValue(new Error("System error"))

      const response = await POST()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe("Cleanup failed")
      expect(data.details).toBe("System error")
    })
  })
})
