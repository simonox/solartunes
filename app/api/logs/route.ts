import { NextResponse } from "next/server"

export async function GET() {
  try {
    // For preview purposes, return fake system logs
    const currentTime = new Date()
    const formatTime = (date: Date) => {
      return date.toISOString().slice(0, 19).replace("T", " ")
    }

    const fakeLogs = [
      `${formatTime(new Date(currentTime.getTime() - 5000))} raspberrypi systemd[1]: Started SolarTunes Sound Player.`,
      `${formatTime(new Date(currentTime.getTime() - 30000))} raspberrypi solartunes[1234]: Server listening on port 3000`,
      `${formatTime(new Date(currentTime.getTime() - 45000))} raspberrypi solartunes[1234]: Found 8 .wav files in /home/pi/Music`,
      `${formatTime(new Date(currentTime.getTime() - 60000))} raspberrypi kernel: ALSA PCM card 0 device 0 subdevice 0`,
      `${formatTime(new Date(currentTime.getTime() - 75000))} raspberrypi solartunes[1234]: Audio system initialized successfully`,
      `${formatTime(new Date(currentTime.getTime() - 90000))} raspberrypi systemd[1]: solartunes.service Main process exited successfully`,
      `${formatTime(new Date(currentTime.getTime() - 105000))} raspberrypi systemd[1]: solartunes.service Succeeded`,
      `${formatTime(new Date(currentTime.getTime() - 120000))} raspberrypi solartunes[1234]: Playing ambient-forest.wav`,
      `${formatTime(new Date(currentTime.getTime() - 135000))} raspberrypi kernel: USB device disconnected`,
      `${formatTime(new Date(currentTime.getTime() - 150000))} raspberrypi dhcpcd[456]: wlan0 carrier acquired`,
      `${formatTime(new Date(currentTime.getTime() - 165000))} raspberrypi systemd[1]: Reached target Sound Card`,
      `${formatTime(new Date(currentTime.getTime() - 180000))} raspberrypi solartunes[1234]: API endpoint /api/files accessed`,
      `${formatTime(new Date(currentTime.getTime() - 195000))} raspberrypi kernel: Bluetooth BNEP Ethernet Emulation ver 1.3`,
      `${formatTime(new Date(currentTime.getTime() - 210000))} raspberrypi systemd[1]: Started Load/Save RF Kill Switch Status`,
      `${formatTime(new Date(currentTime.getTime() - 225000))} raspberrypi solartunes[1234]: Environment NODE_ENV=production PORT=3000`,
      `${formatTime(new Date(currentTime.getTime() - 240000))} raspberrypi systemd[1]: Starting SolarTunes Sound Player`,
      `${formatTime(new Date(currentTime.getTime() - 255000))} raspberrypi kernel: CPU 0 PID 1234 Comm node`,
      `${formatTime(new Date(currentTime.getTime() - 270000))} raspberrypi systemd[1]: solartunes.service RestartSec=10s expired scheduling restart`,
      `${formatTime(new Date(currentTime.getTime() - 285000))} raspberrypi solartunes[1234]: Solar panel voltage 12.4V Battery 87%`,
      `${formatTime(new Date(currentTime.getTime() - 300000))} raspberrypi systemd[1]: Created slice User and Session Slice`,
    ]

    return NextResponse.json({ logs: fakeLogs })
  } catch (error) {
    console.error("Error fetching logs:", error)
    return NextResponse.json({ logs: ["Error fetching system logs"] })
  }
}
