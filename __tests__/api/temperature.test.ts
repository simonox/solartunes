import { GET } from "@/app/api/temperature/route"
import jest from "jest"

// Mock child_process
jest.mock("child_process", () => ({
  exec: jest.fn(),
}))

jest.mock("util", () => ({
  promisify: jest.fn((fn) => fn),
}))

const mockExec = require("child_process").exec as jest.MockedFunction<any>

describe("/api/temperature", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    console.error = jest.fn()
  })

  describe("GET", () => {
    it("should return temperature from vcgencmd", async () => {
      mockExec.mockResolvedValue({ stdout: "temp=42.8'C\n" })

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.temperature).toBe(42.8)
      expect(data.unit).toBe("°C")
      expect(data.status).toBe("normal")
    })

    it("should classify temperature status correctly", async () => {
      // Test hot temperature
      mockExec.mockResolvedValueOnce({ stdout: "temp=75.2'C\n" })
      let response = await GET()
      let data = await response.json()
      expect(data.status).toBe("hot")

      // Test warm temperature
      mockExec.mockResolvedValueOnce({ stdout: "temp=55.0'C\n" })
      response = await GET()
      data = await response.json()
      expect(data.status).toBe("warm")

      // Test normal temperature
      mockExec.mockResolvedValueOnce({ stdout: "temp=35.5'C\n" })
      response = await GET()
      data = await response.json()
      expect(data.status).toBe("normal")
    })

    it("should fallback to thermal zone when vcgencmd fails", async () => {
      mockExec.mockRejectedValueOnce(new Error("vcgencmd not found")).mockResolvedValueOnce({ stdout: "45000\n" }) // 45°C in millicelsius

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.temperature).toBe(45)
      expect(data.unit).toBe("°C")
      expect(data.source).toBe("thermal_zone")
      expect(data.status).toBe("normal")
    })

    it("should handle thermal zone hot temperature", async () => {
      mockExec.mockRejectedValueOnce(new Error("vcgencmd not found")).mockResolvedValueOnce({ stdout: "72000\n" }) // 72°C in millicelsius

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.temperature).toBe(72)
      expect(data.status).toBe("hot")
    })

    it("should handle unparseable vcgencmd output", async () => {
      mockExec.mockResolvedValueOnce({ stdout: "invalid output" }).mockResolvedValueOnce({ stdout: "50000\n" }) // fallback to thermal zone

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.temperature).toBe(50)
      expect(data.source).toBe("thermal_zone")
    })

    it("should handle both vcgencmd and thermal zone failures", async () => {
      mockExec
        .mockRejectedValueOnce(new Error("vcgencmd not found"))
        .mockRejectedValueOnce(new Error("thermal zone not available"))

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe("Temperature monitoring not available")
      expect(data.details).toBe("vcgencmd not found")
    })

    it("should handle invalid thermal zone data", async () => {
      mockExec.mockRejectedValueOnce(new Error("vcgencmd failed")).mockResolvedValueOnce({ stdout: "not a number\n" })

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe("Temperature monitoring not available")
    })

    it("should handle general error", async () => {
      mockExec.mockImplementation(() => {
        throw new Error("System error")
      })

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe("Temperature monitoring not available")
      expect(data.details).toBe("System error")
    })
  })
})
