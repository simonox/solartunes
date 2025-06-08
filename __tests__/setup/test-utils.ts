import { NextRequest } from "next/server"
import type { jest } from "@jest/globals"

/**
 * Helper function to create a mock NextRequest for testing
 */
export function createMockRequest(
  url: string,
  options: {
    method?: string
    body?: any
    headers?: Record<string, string>
  } = {},
): NextRequest {
  const { method = "GET", body, headers = {} } = options

  return new NextRequest(url, {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  })
}

/**
 * Helper function to create a mock FormData request
 */
export function createMockFormDataRequest(url: string, formData: FormData): NextRequest {
  return new NextRequest(url, {
    method: "POST",
    body: formData,
  })
}

/**
 * Helper function to create a mock File for testing uploads
 */
export function createMockFile(name: string, content = "mock file content", type = "audio/wav"): File {
  const blob = new Blob([content], { type })
  return new File([blob], name, { type })
}

/**
 * Helper to mock child_process exec with specific responses
 */
export function mockExecResponses(responses: Array<{ stdout?: string; stderr?: string; error?: Error }>) {
  const mockExec = require("child_process").exec as jest.MockedFunction<any>

  responses.forEach((response, index) => {
    if (response.error) {
      mockExec.mockRejectedValueOnce(response.error)
    } else {
      mockExec.mockResolvedValueOnce({
        stdout: response.stdout || "",
        stderr: response.stderr || "",
      })
    }
  })
}
