import { GET } from "@/app/api/debug-hifiberry/route"
import jest from "jest"

// Mock child_process
jest.mock("child_process", () => ({
  exec: jest.fn(),
}))

jest.mock("util", () => ({
  promisify: jest.fn((fn) => fn),
}))

const mockExec = require("child_process").exec as jest.MockedFunction<any>

describe("/api/debug-hifiberry", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    console.error = jest.fn()
  })

  describe("GET", () => {
    it("should return comprehensive HiFiBerry debug info", async () => {
      // Mock all command outputs
      mockExec
        .mockResolvedValueOnce({ stdout: "snd_rpi_hifiberry_dacplus" }) // lsmod
        .mockResolvedValueOnce({ stdout: "sndrpihifiberry" }) // card id
        .mockResolvedValueOnce({ stdout: "numid=1,iface=MIXER,name=Digital Playbook Volume" }) // controls
        .mockResolvedValueOnce({ stdout: "Simple mixer control Digital,0" }) // volume status
        .mockResolvedValueOnce({ stdout: "card 0: sndrpihifiberry" }) // pcm info
        .mockResolvedValueOnce({ stdout: "dtoverlay=hifiberry-dacplus" }) // boot config
        .mockResolvedValueOnce({ stdout: "pi 1234 aplay" }) // processes

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.device).toBe("HiFiBerry DAC+")
      expect(data.hifiberryDriver).toBe("snd_rpi_hifiberry_dacplus")
      expect(data.audioCard).toBe("sndrpihifiberry")
      expect(data.availableControls).toHaveLength(1)
      expect(data.volumeStatus).toHaveProperty("Digital Playback Volume")
      expect(data.bootConfiguration).toBe("dtoverlay=hifiberry-dacplus")
    })

    it("should handle missing HiFiBerry driver", async () => {
      mockExec
        .mockRejectedValueOnce(new Error("No such module")) // lsmod fails
        .mockResolvedValueOnce({ stdout: "bcm2835" }) // fallback card
        .mockResolvedValueOnce({ stdout: "numid=1,iface=MIXER,name=PCM" }) // controls
        .mockResolvedValueOnce({ stdout: "Not available" }) // volume
        .mockResolvedValueOnce({ stdout: "card info" }) // pcm
        .mockRejectedValueOnce(new Error("Permission denied")) // boot config
        .mockResolvedValueOnce({ stdout: "" }) // no processes

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.hifiberryDriverError).toBe("HiFiBerry driver not found")
      expect(data.audioCard).toBe("bcm2835")
      expect(data.bootConfigError).toBe("Could not read /boot/config.txt")
    })

    it("should handle system errors gracefully", async () => {
      mockExec.mockRejectedValue(new Error("System failure"))

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.hifiberryDriverError).toBe("HiFiBerry driver not found")
      expect(data.audioCardError).toBe("Could not read audio card info")
    })
  })
})
