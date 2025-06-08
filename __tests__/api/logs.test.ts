import { GET } from "@/app/api/logs/route"
import jest from "jest"

// Mock child_process
jest.mock("child_process", () => ({
  exec: jest.fn(),
}))

jest.mock("util", () => ({
  promisify: jest.fn((fn) => fn),
}))

const mockExec = require("child_process").exec as jest.MockedFunction<any>

describe("/api/logs", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    console.log = jest.fn()
    console.error = jest.fn()
  })

  describe("GET", () => {
    it("should return system logs successfully", async () => {
      const mockLogs = [
        "2024-01-01T10:00:00 solartunes: Service started",
        "2024-01-01T10:01:00 aplay: Playing audio file",
        "2024-01-01T10:02:00 solartunes: Motion detected",
      ]

      mockExec
        .mockResolvedValueOnce({ stdout: mockLogs.slice(0, 2).join("\n") }) // solartunes logs
        .mockResolvedValueOnce({ stdout: mockLogs[2] }) // filtered logs

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.logs).toHaveLength(3)
      expect(data.logs).toContain(mockLogs[0])
      expect(data.logs).toContain(mockLogs[1])
      expect(data.logs).toContain(mockLogs[2])
    })

    it("should handle command failures gracefully", async () => {
      mockExec.mockRejectedValueOnce(new Error("Command failed")).mockRejectedValueOnce(new Error("Command failed"))

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.logs).toHaveLength(1)
      expect(data.logs[0]).toMatch(/No recent system logs found/)
    })

    it("should return default message when no logs found", async () => {
      mockExec.mockResolvedValueOnce({ stdout: "" }).mockResolvedValueOnce({ stdout: "" })

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.logs).toHaveLength(1)
      expect(data.logs[0]).toMatch(/No recent system logs found/)
    })

    it("should limit logs to last 20 entries", async () => {
      const manyLogs = Array.from(
        { length: 30 },
        (_, i) => `2024-01-01T10:${i.toString().padStart(2, "0")}:00 Log entry ${i}`,
      )

      mockExec.mockResolvedValueOnce({ stdout: manyLogs.join("\n") }).mockResolvedValueOnce({ stdout: "" })

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.logs).toHaveLength(20)
    })

    it("should handle general error", async () => {
      mockExec.mockImplementation(() => {
        throw new Error("System error")
      })

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.logs).toHaveLength(1)
      expect(data.logs[0]).toMatch(/Error fetching system logs/)
    })
  })
})
