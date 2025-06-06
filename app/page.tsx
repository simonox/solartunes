"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import {
  Play,
  Pause,
  Music,
  Leaf,
  Sun,
  Zap,
  Volume2,
  VolumeX,
  AlertTriangle,
  Thermometer,
  Activity,
  Eye,
  EyeOff,
} from "lucide-react"

interface MusicFile {
  name: string
  path: string
}

interface TemperatureData {
  temperature: number
  unit: string
  status: string
  source?: string
}

interface MotionData {
  enabled: boolean
  selectedFile: string | null
  lastMotionTime: string | null
  motionCount: number
}

export default function MusicPlayer() {
  const [files, setFiles] = useState<MusicFile[]>([])
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null)
  const [logs, setLogs] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [volume, setVolume] = useState(50)
  const [isSettingVolume, setIsSettingVolume] = useState(false)
  const [volumeError, setVolumeError] = useState<string | null>(null)
  const [temperature, setTemperature] = useState<TemperatureData | null>(null)
  const [motion, setMotion] = useState<MotionData>({
    enabled: false,
    selectedFile: null,
    lastMotionTime: null,
    motionCount: 0,
  })

  // Fetch music files
  useEffect(() => {
    fetchFiles()
  }, [])

  // Poll for logs, temperature, and motion status
  useEffect(() => {
    const interval = setInterval(() => {
      fetchLogs()
      fetchTemperature()
      fetchMotionStatus()
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  // Get initial volume
  useEffect(() => {
    fetchVolume()
  }, [])

  const fetchFiles = async () => {
    try {
      const response = await fetch("/api/files")
      const data = await response.json()

      if (!response.ok) {
        console.error("API Error:", data.error, data.details)
        setFiles([])
        return
      }

      setFiles(data.files || [])
      console.log(`Loaded ${data.files?.length || 0} files`)
    } catch (error) {
      console.error("Failed to fetch files:", error)
      setFiles([])
    } finally {
      setLoading(false)
    }
  }

  const fetchLogs = async () => {
    try {
      const response = await fetch("/api/logs")
      const data = await response.json()
      setLogs(data.logs || [])
    } catch (error) {
      console.error("Failed to fetch logs:", error)
    }
  }

  const fetchTemperature = async () => {
    try {
      const response = await fetch("/api/temperature")
      const data = await response.json()

      if (response.ok) {
        setTemperature(data)
      } else {
        console.error("Temperature error:", data.error)
      }
    } catch (error) {
      console.error("Failed to fetch temperature:", error)
    }
  }

  const fetchMotionStatus = async () => {
    try {
      const response = await fetch("/api/motion")
      const data = await response.json()

      if (response.ok) {
        setMotion(data)
      }
    } catch (error) {
      console.error("Failed to fetch motion status:", error)
    }
  }

  const fetchVolume = async () => {
    try {
      const response = await fetch("/api/volume")
      const data = await response.json()
      setVolume(data.volume)

      if (data.error) {
        setVolumeError(data.error)
        console.log("Available controls:", data.availableControls)
      } else {
        setVolumeError(null)
      }
    } catch (error) {
      console.error("Failed to fetch volume:", error)
      setVolumeError("Failed to connect to volume API")
    }
  }

  const handleVolumeChange = async (value: number[]) => {
    const newVolume = value[0]
    setVolume(newVolume)
    setVolumeError(null)

    setIsSettingVolume(true)

    try {
      const response = await fetch("/api/volume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ volume: newVolume }),
      })

      const data = await response.json()

      if (!response.ok) {
        setVolumeError(data.error || "Failed to set volume")
        console.error("Volume error:", data.details)
        console.error("Failed command:", data.command)
      }
    } catch (error) {
      console.error("Failed to set volume:", error)
      setVolumeError("Failed to connect to volume API")
    } finally {
      setIsSettingVolume(false)
    }
  }

  const toggleMotionDetection = async () => {
    try {
      const response = await fetch("/api/motion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle" }),
      })

      if (response.ok) {
        const data = await response.json()
        setMotion(data)
      }
    } catch (error) {
      console.error("Failed to toggle motion detection:", error)
    }
  }

  const setMotionFile = async (fileName: string | null) => {
    try {
      const response = await fetch("/api/motion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "setFile", fileName }),
      })

      if (response.ok) {
        const data = await response.json()
        setMotion(data)
      }
    } catch (error) {
      console.error("Failed to set motion file:", error)
    }
  }

  const testMotion = async () => {
    try {
      const response = await fetch("/api/motion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "triggerMotion" }),
      })

      if (response.ok) {
        const data = await response.json()
        setMotion(data)
      }
    } catch (error) {
      console.error("Failed to test motion:", error)
    }
  }

  const playFile = async (fileName: string) => {
    if (currentlyPlaying === fileName) {
      await fetch("/api/stop", { method: "POST" })
      setCurrentlyPlaying(null)
      return
    }

    if (currentlyPlaying) {
      await fetch("/api/stop", { method: "POST" })
    }

    try {
      const response = await fetch("/api/play", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName }),
      })

      if (response.ok) {
        setCurrentlyPlaying(fileName)
        const checkStatus = setInterval(async () => {
          const statusResponse = await fetch("/api/status")
          const statusData = await statusResponse.json()
          if (!statusData.playing) {
            setCurrentlyPlaying(null)
            clearInterval(checkStatus)
          }
        }, 1000)
      }
    } catch (error) {
      console.error("Failed to play file:", error)
    }
  }

  const getTemperatureColor = (temp: number) => {
    if (temp > 70) return "text-red-600 bg-red-50"
    if (temp > 50) return "text-orange-600 bg-orange-50"
    return "text-green-600 bg-green-50"
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-green-100">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-green-600 via-emerald-500 to-teal-600 text-white">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative container mx-auto px-6 py-12">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
              <Music className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-2">SolarTunes</h1>
              <p className="text-green-100 text-lg">Sustainable Sound Player for Raspberry Pi</p>
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Leaf className="h-4 w-4" />
              <span>Eco-Friendly</span>
            </div>
            <div className="flex items-center gap-2">
              <Sun className="h-4 w-4" />
              <span>Solar Powered</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              <span>Low Energy</span>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Volume Error Alert */}
        {volumeError && (
          <Alert className="mb-6 border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Volume control issue: {volumeError}. Check the system logs for more details.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Music Library */}
          <div className="lg:col-span-2">
            <Card className="bg-white/70 backdrop-blur-sm border-green-200 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-green-500/10 to-emerald-500/10">
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <Music className="h-5 w-5" />
                  Sound Library
                  <Badge variant="secondary" className="ml-auto bg-green-100 text-green-700">
                    {files.length} tracks
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 flex gap-6">
                {/* Volume Slider (Vertical) */}
                <div className="flex flex-col items-center gap-3 pr-4 border-r border-green-100 min-w-[60px]">
                  <div className={`p-2 rounded-full ${volume === 0 ? "bg-gray-200" : "bg-green-100"}`}>
                    {volume === 0 ? (
                      <VolumeX className="h-5 w-5 text-gray-500" />
                    ) : (
                      <Volume2 className="h-5 w-5 text-green-600" />
                    )}
                  </div>
                  <div className="flex flex-col items-center h-[350px] justify-center">
                    <Slider
                      value={[volume]}
                      max={100}
                      step={1}
                      orientation="vertical"
                      className="h-[280px]"
                      onValueChange={handleVolumeChange}
                      disabled={isSettingVolume}
                    />
                  </div>
                  <span className="text-sm font-medium text-center">{volume}%</span>
                  {volumeError && <p className="text-xs text-yellow-600 text-center">Volume issue</p>}
                </div>

                {/* Files List */}
                <div className="flex-1">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                    </div>
                  ) : files.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <Music className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="mb-2">No .wav files found in ~/Music directory</p>
                      <p className="text-sm">Make sure you have .wav files in your Music folder</p>
                      <Button
                        onClick={fetchFiles}
                        variant="outline"
                        size="sm"
                        className="mt-4 border-green-300 text-green-700 hover:bg-green-50"
                      >
                        Refresh
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {files.map((file, index) => (
                        <div
                          key={index}
                          className={`flex items-center justify-between p-4 rounded-lg border transition-all duration-200 ${
                            currentlyPlaying === file.name
                              ? "bg-green-50 border-green-300 shadow-md"
                              : motion.selectedFile === file.name
                                ? "bg-purple-50 border-purple-300 shadow-md"
                                : "bg-white/50 border-gray-200 hover:bg-green-50/50 hover:border-green-200"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`p-2 rounded-full ${
                                currentlyPlaying === file.name
                                  ? "bg-green-500 text-white"
                                  : motion.selectedFile === file.name
                                    ? "bg-purple-500 text-white"
                                    : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {motion.selectedFile === file.name ? (
                                <Activity className="h-4 w-4" />
                              ) : (
                                <Music className="h-4 w-4" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{file.name}</p>
                              <p className="text-sm text-gray-500">{file.path}</p>
                              {motion.selectedFile === file.name && (
                                <p className="text-xs text-purple-600 font-medium">Motion Trigger</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              onClick={() => setMotionFile(motion.selectedFile === file.name ? null : file.name)}
                              variant="outline"
                              size="sm"
                              className={
                                motion.selectedFile === file.name
                                  ? "bg-purple-100 border-purple-300 text-purple-700 hover:bg-purple-200"
                                  : "border-purple-300 text-purple-700 hover:bg-purple-50"
                              }
                            >
                              <Activity className="h-4 w-4 mr-1" />
                              {motion.selectedFile === file.name ? "Unset" : "Motion"}
                            </Button>
                            <Button
                              onClick={() => playFile(file.name)}
                              variant={currentlyPlaying === file.name ? "default" : "outline"}
                              size="sm"
                              className={
                                currentlyPlaying === file.name
                                  ? "bg-green-600 hover:bg-green-700"
                                  : "border-green-300 text-green-700 hover:bg-green-50"
                              }
                            >
                              {currentlyPlaying === file.name ? (
                                <>
                                  <Pause className="h-4 w-4 mr-2" />
                                  Stop
                                </>
                              ) : (
                                <>
                                  <Play className="h-4 w-4 mr-2" />
                                  Play
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Widgets and Logs */}
          <div className="lg:col-span-1 space-y-6">
            {/* System Widgets Row */}
            <div className="grid grid-cols-2 gap-4">
              {/* Temperature Widget */}
              <Card className="bg-white/70 backdrop-blur-sm border-green-200 shadow-xl">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Thermometer className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">CPU Temp</span>
                  </div>
                  {temperature ? (
                    <div className={`text-center p-2 rounded ${getTemperatureColor(temperature.temperature)}`}>
                      <div className="text-2xl font-bold">{temperature.temperature.toFixed(1)}°C</div>
                      <div className="text-xs capitalize">{temperature.status}</div>
                    </div>
                  ) : (
                    <div className="text-center p-2 text-gray-500">
                      <div className="text-sm">Loading...</div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Motion Detection Widget */}
              <Card className="bg-white/70 backdrop-blur-sm border-green-200 shadow-xl">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium text-gray-700">Motion</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={motion.enabled}
                        onCheckedChange={toggleMotionDetection}
                        className="data-[state=checked]:bg-green-600"
                      />
                      <span className="text-xs">
                        {motion.enabled ? (
                          <span className="flex items-center gap-1 text-green-600">
                            <Eye className="h-3 w-3" />
                            Active
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-gray-500">
                            <EyeOff className="h-3 w-3" />
                            Inactive
                          </span>
                        )}
                      </span>
                    </div>

                    {motion.selectedFile && (
                      <div className="text-xs text-center text-purple-600 bg-purple-50 p-1 rounded">
                        {motion.selectedFile}
                      </div>
                    )}

                    <Button
                      onClick={testMotion}
                      size="sm"
                      variant="outline"
                      className="w-full h-6 text-xs border-purple-300 text-purple-700 hover:bg-purple-50"
                    >
                      Test Motion
                    </Button>

                    {motion.motionCount > 0 && (
                      <div className="text-xs text-center text-gray-500">Triggered: {motion.motionCount}x</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* System Logs */}
            <Card className="bg-white/70 backdrop-blur-sm border-green-200 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10">
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <Zap className="h-5 w-5" />
                  System Logs
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-80 p-4">
                  <div className="space-y-1">
                    {logs.length === 0 ? (
                      <p className="text-gray-500 text-sm">No recent logs...</p>
                    ) : (
                      logs.map((log, index) => (
                        <div
                          key={index}
                          className="text-xs font-mono bg-gray-50 p-2 rounded border-l-2 border-green-300"
                        >
                          {log}
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Currently Playing Status */}
        {currentlyPlaying && (
          <Card className="mt-8 bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-full">
                  <Play className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm opacity-90">Now Playing</p>
                  <p className="text-xl font-semibold">{currentlyPlaying}</p>
                </div>
                <div className="ml-auto">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-white/70 rounded-full animate-pulse delay-100"></div>
                    <div className="w-2 h-2 bg-white/50 rounded-full animate-pulse delay-200"></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
