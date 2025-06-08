"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Play,
  CircleStopIcon as Stop,
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
  Upload,
  CheckCircle,
  XCircle,
  Loader2,
  HardDrive,
  Lock,
  Unlock,
  Database,
  FileText,
  Shield,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"

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
  currentlyPlaying: string | null
}

interface SDCardData {
  readOnly: boolean
  mountInfo?: string
  usage?: {
    total: string
    used: string
    available: string
    percentage: string
  }
  ramDiskUsage?: string
  serviceRunning?: boolean
  healthInfo?: string[]
  hardwareWriteProtect?: boolean | null
  filesystem?: string
  hasServiceManagement?: boolean
  timestamp: string
}

interface WebhookScript {
  name: string
  path: string
  size: number
  modified: string
}

interface WebhookData {
  selectedScript: string
  lastSaved: string | null
  availableScripts: WebhookScript[]
  timestamp: string
}

export default function MusicPlayer() {
  const [files, setFiles] = useState<MusicFile[]>([])
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null)
  const [isMotionTriggered, setIsMotionTriggered] = useState(false) // Track if current track was started by motion
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
    currentlyPlaying: null,
  })
  const [sdCard, setSDCard] = useState<SDCardData | null>(null)
  const [webhook, setWebhook] = useState<WebhookData>({
    selectedScript: "defaultScript", // Updated default value
    lastSaved: null,
    availableScripts: [],
    timestamp: new Date().toISOString(),
  })
  const [webhookSaving, setWebhookSaving] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<{
    uploading: boolean
    success: boolean | null
    message: string
  }>({
    uploading: false,
    success: null,
    message: "",
  })

  // Toast notifications
  const { toast } = useToast()

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch music files
  useEffect(() => {
    fetchFiles()
    fetchWebhookConfig()
  }, [])

  // Poll for logs, temperature, and motion status
  useEffect(() => {
    const interval = setInterval(() => {
      fetchLogs()
      fetchTemperature()
      fetchMotionStatus()
      fetchSDCardStatus()
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  // Get initial volume
  useEffect(() => {
    fetchVolume()
  }, [])

  // Get initial SD card status
  useEffect(() => {
    fetchSDCardStatus()
  }, [])

  // Effect to update currentlyPlaying from motion detection
  useEffect(() => {
    if (motion.currentlyPlaying && !currentlyPlaying) {
      setCurrentlyPlaying(motion.currentlyPlaying)
      setIsMotionTriggered(true) // Mark as motion-triggered
    }
  }, [motion.currentlyPlaying, currentlyPlaying])

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

        // Auto-enable motion detection if a file is selected and motion is not already enabled
        if (data.selectedFile && !data.enabled) {
          console.log("Auto-enabling motion detection for configured file:", data.selectedFile)
          try {
            const enableResponse = await fetch("/api/motion", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "toggle" }),
            })

            if (enableResponse.ok) {
              const updatedData = await enableResponse.json()
              setMotion(updatedData)
            }
          } catch (error) {
            console.error("Failed to auto-enable motion detection:", error)
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch motion status:", error)
    }
  }

  const fetchSDCardStatus = async () => {
    try {
      const response = await fetch("/api/sdcard")
      const data = await response.json()

      if (response.ok) {
        setSDCard(data)
      } else {
        console.error("SD card status error:", data.error)
      }
    } catch (error) {
      console.error("Failed to fetch SD card status:", error)
    }
  }

  const fetchWebhookConfig = async () => {
    try {
      const response = await fetch("/api/webhook")
      const data = await response.json()

      if (response.ok) {
        setWebhook(data)
      } else {
        console.error("Webhook config error:", data.error)
      }
    } catch (error) {
      console.error("Failed to fetch webhook config:", error)
    }
  }

  const saveWebhookConfig = async () => {
    setWebhookSaving(true)
    try {
      const response = await fetch("/api/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save",
          selectedScript: webhook.selectedScript,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setWebhook((prev) => ({
          ...prev,
          selectedScript: data.selectedScript,
          lastSaved: data.lastSaved,
        }))
        toast({ title: "Webhook configuration saved successfully", variant: "default" })
        // Fetch updated config after successful save
        await fetchWebhookConfig()
      } else {
        toast({ title: `Failed to save webhook: ${data.error}`, variant: "destructive" })
      }
    } catch (error) {
      console.error("Failed to save webhook config:", error)
      toast({ title: "Failed to save webhook configuration", variant: "destructive" })
    } finally {
      setWebhookSaving(false)
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

        if (fileName) {
          toast({ title: `Motion trigger set to "${fileName}"`, variant: "default" })
        } else {
          toast({ title: "Motion trigger removed", variant: "default" })
        }
      }
    } catch (error) {
      console.error("Failed to set motion file:", error)
      toast({ title: "Failed to update motion settings", variant: "destructive" })
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Check if SD card is locked
    if (sdCard?.readOnly) {
      setUploadStatus({
        uploading: false,
        success: false,
        message: "Cannot upload files while SD card is locked. Please unlock the SD card first.",
      })
      return
    }

    // Check file type
    if (!file.name.toLowerCase().endsWith(".wav")) {
      setUploadStatus({
        uploading: false,
        success: false,
        message: "Only WAV files are accepted",
      })
      return
    }

    setUploadStatus({
      uploading: true,
      success: null,
      message: "Uploading and processing file...",
    })

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        setUploadStatus({
          uploading: false,
          success: true,
          message: `File "${data.fileName}" uploaded and processed successfully!`,
        })

        // Refresh the file list
        await fetchFiles()

        // Clear the input
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
      } else {
        setUploadStatus({
          uploading: false,
          success: false,
          message: data.error || "Upload failed",
        })
      }
    } catch (error) {
      console.error("Upload error:", error)
      setUploadStatus({
        uploading: false,
        success: false,
        message: "Failed to upload file",
      })
    }

    // Clear status after 5 seconds
    setTimeout(() => {
      setUploadStatus({
        uploading: false,
        success: null,
        message: "",
      })
    }, 5000)
  }

  const playFile = async (fileName: string) => {
    // If no track is currently playing, allow play
    if (!currentlyPlaying) {
      try {
        const response = await fetch("/api/play", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileName }),
        })

        if (response.ok) {
          setCurrentlyPlaying(fileName)
          setIsMotionTriggered(false) // Mark as manually triggered
          toast({ title: `Playing "${fileName}"`, variant: "default" })
        } else {
          toast({ title: "Failed to play file", variant: "destructive" })
        }
      } catch (error) {
        console.error("Failed to play file:", error)
        toast({ title: "Failed to play file", variant: "destructive" })
      }
      return
    }

    // If a track is playing, check blocking conditions
    // Only block if motion detection is active AND current track was motion-triggered
    if (motion.enabled && isMotionTriggered) {
      toast({ title: `Motion detection is active.`, variant: "default" })
      return
    }

    // For all other cases (motion off, or manual track playing),
    // stop current track and play new one
    try {
      // Stop current track
      await fetch("/api/stop", { method: "POST" })

      // Small delay to ensure stop completes
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Play new track
      const response = await fetch("/api/play", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName }),
      })

      if (response.ok) {
        setCurrentlyPlaying(fileName)
        setIsMotionTriggered(false) // Mark as manually triggered
        toast({ title: `Now playing "${fileName}"`, variant: "default" })
      } else {
        toast({ title: "Failed to play file", variant: "destructive" })
        // Reset state if play failed
        setCurrentlyPlaying(null)
        setIsMotionTriggered(false)
      }
    } catch (error) {
      console.error("Failed to switch tracks:", error)
      toast({ title: "Failed to switch tracks", variant: "destructive" })
      // Reset state on error
      setCurrentlyPlaying(null)
      setIsMotionTriggered(false)
    }
  }

  const stopPlayback = async () => {
    try {
      await fetch("/api/stop", { method: "POST" })
      setCurrentlyPlaying(null)
      setIsMotionTriggered(false)
      toast({ title: "Playback stopped", variant: "default" })
    } catch (error) {
      console.error("Failed to stop playback:", error)
      toast({ title: "Failed to stop playback", variant: "destructive" })
    }
  }

  const getTemperatureColor = (temp: number) => {
    if (temp > 70) return "text-red-600 bg-red-50"
    if (temp > 50) return "text-orange-600 bg-orange-50"
    return "text-green-600 bg-green-50"
  }

  const resetApp = async () => {
    try {
      // Stop any playing audio
      await fetch("/api/stop", { method: "POST" })

      // Reset all state
      setCurrentlyPlaying(null)
      setIsMotionTriggered(false)
      setMotion((prev) => ({
        ...prev,
        currentlyPlaying: null,
      }))

      // Try to clean up any stuck processes
      try {
        await fetch("/api/cleanup", { method: "POST" })
      } catch (error) {
        console.error("Cleanup failed but continuing with reset:", error)
      }

      toast({ title: "App state reset successfully", variant: "default" })
    } catch (error) {
      console.error("Reset failed:", error)

      // Even if backend fails, reset frontend state
      setCurrentlyPlaying(null)
      setIsMotionTriggered(false)
      setMotion((prev) => ({
        ...prev,
        currentlyPlaying: null,
      }))

      toast({ title: "Reset partially completed", variant: "default" })
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

        {/* SD Card Locked Alert */}
        {sdCard?.readOnly && (
          <Alert className="mb-6 border-blue-200 bg-blue-50">
            <Lock className="h-4 w-4" />
            <AlertDescription>
              SD Card is locked (read-only). The app is running from RAM disk.
              {sdCard.ramDiskUsage && ` RAM usage: ${sdCard.ramDiskUsage}`}
              {!sdCard.serviceRunning && " Service may need restart."}
              Use shell scripts to manage SD card protection.
            </AlertDescription>
          </Alert>
        )}

        {/* Reset Button */}
        <div className="mb-6 flex justify-end">
          <Button
            onClick={resetApp}
            variant="outline"
            className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
          >
            Reset App State
          </Button>
        </div>

        {/* System Widgets Row */}
        <div className="grid grid-cols-3 gap-4 mb-8">
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

          {/* SD Card Widget - Status Only */}
          <Card className="bg-white/70 backdrop-blur-sm border-green-200 shadow-xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <HardDrive className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium text-gray-700">SD Card</span>
                {sdCard?.readOnly && <Database className="h-3 w-3 text-blue-600" title="Using RAM disk" />}
              </div>
              {sdCard ? (
                <div className="space-y-2">
                  <div
                    className={`text-center p-2 rounded ${
                      sdCard.readOnly ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1 text-sm font-medium">
                      {sdCard.readOnly ? (
                        <>
                          <Lock className="h-3 w-3" />
                          Locked
                        </>
                      ) : (
                        <>
                          <Unlock className="h-3 w-3" />
                          Unlocked
                        </>
                      )}
                    </div>
                    {sdCard.usage && <div className="text-xs mt-1">{sdCard.usage.percentage} used</div>}
                    {sdCard.readOnly && sdCard.ramDiskUsage && (
                      <div className="text-xs mt-1 text-blue-600">RAM: {sdCard.ramDiskUsage}</div>
                    )}
                  </div>

                  <div className="text-xs text-center text-gray-600">Use shell scripts to manage</div>

                  {sdCard.hardwareWriteProtect === true && (
                    <div className="text-xs text-center text-red-600">HW Protected</div>
                  )}

                  {!sdCard.serviceRunning && <div className="text-xs text-center text-orange-600">Service Stopped</div>}
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
                  Test Trigger Motion
                </Button>

                {motion.motionCount > 0 && (
                  <div className="text-xs text-center text-gray-500">Triggered: {motion.motionCount}x</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Music Library */}
          <div className="lg:col-span-2 space-y-6">
            {/* Sound Library Card */}
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
                      className="h-[280px] [&>span:first-child]:h-full [&>span:first-child]:w-1 [&>span:first-child]:bg-gray-200 [&>span:first-child]:rounded-full [&_[role=slider]]:bg-green-600 [&_[role=slider]]:border-2 [&_[role=slider]]:border-white [&_[role=slider]]:shadow-md [&>span:last-child]:bg-green-600 [&>span:last-child]:w-1"
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
                              {currentlyPlaying === file.name && (
                                <p className="text-xs text-green-600 font-medium">
                                  {isMotionTriggered ? "Playing (Motion)" : "Playing (Manual)"}
                                </p>
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
                              variant="outline"
                              size="sm"
                              className="border-green-300 text-green-700 hover:bg-green-50"
                            >
                              <Play className="h-4 w-4 mr-2" />
                              Play
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
            {/* Motion Hook Widget */}
            <Card className="bg-white/70 backdrop-blur-sm border-green-200 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-purple-500/10 to-pink-500/10">
                <CardTitle className="flex items-center gap-2 text-purple-800">
                  <Shield className="h-5 w-5" />
                  Motion Hook
                  {webhook.selectedScript && (
                    <Badge variant="secondary" className="ml-auto bg-purple-100 text-purple-700 text-xs">
                      Configured
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="webhook-script" className="block text-sm font-medium text-gray-700 mb-2">
                      Select script to execute on motion:
                    </label>
                    <Select
                      value={webhook.selectedScript}
                      onValueChange={(value) => setWebhook((prev) => ({ ...prev, selectedScript: value }))}
                      disabled={webhookSaving}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose a script..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="defaultScript">
                          <div className="flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-gray-400" />
                            <span>No script (disabled)</span>
                          </div>
                        </SelectItem>
                        {webhook.availableScripts.map((script) => (
                          <SelectItem key={script.name} value={script.name}>
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-purple-600" />
                              <span>{script.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {webhook.availableScripts.length === 0 && (
                    <Alert className="border-yellow-200 bg-yellow-50">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-yellow-800">
                        No shell scripts (.sh files) found in ~/Music directory. Create scripts there to use this
                        feature.
                      </AlertDescription>
                    </Alert>
                  )}

                  {webhook.selectedScript && (
                    <div className="text-xs text-center text-purple-600 bg-purple-50 p-2 rounded">
                      Selected: {webhook.selectedScript}
                    </div>
                  )}

                  <Button
                    onClick={saveWebhookConfig}
                    disabled={webhookSaving}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    {webhookSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Hook"
                    )}
                  </Button>

                  {webhook.lastSaved && (
                    <div className="text-xs text-gray-600 text-center">
                      Last saved: {new Date(webhook.lastSaved).toLocaleString()}
                    </div>
                  )}

                  <div className="text-sm text-gray-600 space-y-1">
                    <p>• Only scripts from ~/Music directory are available</p>
                    <p>• Scripts execute with 30-second timeout</p>
                    <p>• Working directory is set to ~/Music</p>
                    <p>• Select "No script" to disable webhook</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* System Logs */}
            <Card className="bg-white/70 backdrop-blur-sm border-green-200 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10">
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <Zap className="h-5 w-5" />
                  System Logs
                  {sdCard?.readOnly && <Database className="h-4 w-4 text-blue-600" title="From RAM disk" />}
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

            {/* File Upload Widget */}
            <Card className="bg-white/70 backdrop-blur-sm border-green-200 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10">
                <CardTitle className="flex items-center gap-2 text-blue-800">
                  <Upload className="h-5 w-5" />
                  Upload WAV File
                  {sdCard?.readOnly && <Lock className="h-4 w-4 text-red-600" title="SD card locked" />}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex flex-col gap-4">
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept=".wav"
                      onChange={handleFileUpload}
                      disabled={uploadStatus.uploading || sdCard?.readOnly}
                      className="w-full"
                    />
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadStatus.uploading || sdCard?.readOnly}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      {uploadStatus.uploading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : sdCard?.readOnly ? (
                        <>
                          <Lock className="h-4 w-4 mr-2" />
                          SD Card Locked
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Select File
                        </>
                      )}
                    </Button>
                  </div>

                  {uploadStatus.message && (
                    <Alert
                      className={`${
                        uploadStatus.success === true
                          ? "border-green-200 bg-green-50"
                          : uploadStatus.success === false
                            ? "border-red-200 bg-red-50"
                            : "border-blue-200 bg-blue-50"
                      }`}
                    >
                      {uploadStatus.success === true ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : uploadStatus.success === false ? (
                        <XCircle className="h-4 w-4 text-red-600" />
                      ) : (
                        <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                      )}
                      <AlertDescription
                        className={
                          uploadStatus.success === true
                            ? "text-green-800"
                            : uploadStatus.success === false
                              ? "text-red-800"
                              : "text-blue-800"
                        }
                      >
                        {uploadStatus.message}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="text-sm text-gray-600 space-y-1">
                    <p>• Only WAV files are accepted</p>
                    <p>• Files will be automatically processed to ensure compatibility</p>
                    <p>• Processed files will be converted to: 16-bit PCM, 44.1kHz, Stereo</p>
                    {sdCard?.readOnly && <p className="text-red-600">• Unlock SD card before uploading files</p>}
                  </div>
                </div>
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
                <div className="flex-1">
                  <p className="text-sm opacity-90">Now Playing</p>
                  <p className="text-xl font-semibold">{currentlyPlaying}</p>
                  <p className="text-sm opacity-75">
                    {isMotionTriggered ? "Started by motion detection" : "Started manually"}
                    {sdCard?.readOnly && " • Running from RAM disk"}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <Button
                    onClick={stopPlayback}
                    variant="outline"
                    size="sm"
                    className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                  >
                    <Stop className="h-4 w-4 mr-2" />
                    Stop
                  </Button>
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
        <Toaster />
      </div>
    </div>
  )
}
