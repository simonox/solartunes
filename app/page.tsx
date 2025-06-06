"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Play, Pause, Music, Leaf, Sun, Zap, Volume2, VolumeX, AlertTriangle } from "lucide-react"

interface MusicFile {
  name: string
  path: string
}

export default function MusicPlayer() {
  const [files, setFiles] = useState<MusicFile[]>([])
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null)
  const [logs, setLogs] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [volume, setVolume] = useState(50)
  const [isSettingVolume, setIsSettingVolume] = useState(false)
  const [volumeError, setVolumeError] = useState<string | null>(null)

  // Fetch music files
  useEffect(() => {
    fetchFiles()
  }, [])

  // Poll for logs
  useEffect(() => {
    const interval = setInterval(fetchLogs, 2000)
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

    // Debounce volume changes to avoid too many API calls
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
        if (data.availableControls) {
          console.log("Available controls:", data.availableControls)
        }
      }
    } catch (error) {
      console.error("Failed to set volume:", error)
      setVolumeError("Failed to connect to volume API")
    } finally {
      setIsSettingVolume(false)
    }
  }

  const playFile = async (fileName: string) => {
    if (currentlyPlaying === fileName) {
      // Stop current playback
      await fetch("/api/stop", { method: "POST" })
      setCurrentlyPlaying(null)
      return
    }

    if (currentlyPlaying) {
      // Stop any currently playing file
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
        // Poll for playback status
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
        {/* Decorative elements */}
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
          {/* Volume Control */}
          <div className="lg:col-span-2 lg:order-1 order-2 flex lg:hidden mb-4">
            <Card className="bg-white/70 backdrop-blur-sm border-green-200 shadow-xl w-full">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-full ${volume === 0 ? "bg-gray-200" : "bg-green-100"}`}>
                    {volume === 0 ? (
                      <VolumeX className="h-5 w-5 text-gray-500" />
                    ) : (
                      <Volume2 className="h-5 w-5 text-green-600" />
                    )}
                  </div>
                  <Slider
                    defaultValue={[volume]}
                    value={[volume]}
                    max={100}
                    step={1}
                    className="flex-1"
                    onValueChange={handleVolumeChange}
                    disabled={isSettingVolume}
                  />
                  <span className="text-sm font-medium w-8 text-right">{volume}%</span>
                </div>
                {volumeError && <p className="text-xs text-yellow-600 mt-2">Volume control may not work properly</p>}
              </CardContent>
            </Card>
          </div>

          {/* Music Library */}
          <div className="lg:col-span-2 lg:order-1 order-3 flex">
            <Card className="bg-white/70 backdrop-blur-sm border-green-200 shadow-xl w-full">
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
                <div className="hidden lg:flex flex-col items-center gap-3 pr-2 border-r border-green-100">
                  <div className={`p-2 rounded-full ${volume === 0 ? "bg-gray-200" : "bg-green-100"}`}>
                    {volume === 0 ? (
                      <VolumeX className="h-5 w-5 text-gray-500" />
                    ) : (
                      <Volume2 className="h-5 w-5 text-green-600" />
                    )}
                  </div>
                  <Slider
                    defaultValue={[volume]}
                    value={[volume]}
                    max={100}
                    step={1}
                    orientation="vertical"
                    className="h-[300px]"
                    onValueChange={handleVolumeChange}
                    disabled={isSettingVolume}
                  />
                  <span className="text-sm font-medium">{volume}%</span>
                  {volumeError && <p className="text-xs text-yellow-600 text-center">Volume control issue</p>}
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
                              : "bg-white/50 border-gray-200 hover:bg-green-50/50 hover:border-green-200"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`p-2 rounded-full ${
                                currentlyPlaying === file.name ? "bg-green-500 text-white" : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              <Music className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{file.name}</p>
                              <p className="text-sm text-gray-500">{file.path}</p>
                            </div>
                          </div>
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
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* System Logs */}
          <div className="lg:col-span-1 lg:order-2 order-4">
            <Card className="bg-white/70 backdrop-blur-sm border-green-200 shadow-xl h-fit">
              <CardHeader className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10">
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <Zap className="h-5 w-5" />
                  System Logs
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-96 p-4">
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
