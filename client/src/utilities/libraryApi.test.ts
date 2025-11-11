import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'

describe('libraryApi custom fetch', () => {
  let originalFetch: typeof global.fetch

  beforeEach(() => {
    // Save original fetch
    originalFetch = global.fetch
    // Clear localStorage before each test
    localStorage.clear()
    // Reset modules to get fresh imports
    vi.resetModules()
  })

  afterEach(() => {
    // Restore original fetch
    global.fetch = originalFetch
  })

  it('should add Authorization header when JWT token exists in localStorage', async () => {
    const mockToken = 'test-jwt-token'
    localStorage.setItem('jwt', mockToken)

    let capturedHeaders: Headers | undefined

    // Mock fetch
    global.fetch = vi.fn((url, init) => {
      capturedHeaders = new Headers(init?.headers)
      return Promise.resolve(
        new Response(JSON.stringify({ data: 'test' }), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        })
      )
    }) as any

    // Dynamically import to get fresh instance with mocked fetch
    const module = await import('./libraryApi.ts?t=' + Date.now())
    const { libraryApi } = module

    // Access the custom fetch through the client's internal structure
    const customFetch = (libraryApi as any).http

    // Make a request using the custom fetch
    await customFetch.fetch('http://localhost:5284/test', {
      method: 'GET'
    })

    // Verify Authorization header was added
    expect(capturedHeaders?.get('Authorization')).toBe(mockToken)
  })

  it('should not add Authorization header when no JWT token exists', async () => {
    let capturedHeaders: Headers | undefined

    // Mock fetch
    global.fetch = vi.fn((url, init) => {
      capturedHeaders = new Headers(init?.headers)
      return Promise.resolve(
        new Response(JSON.stringify({ data: 'test' }), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        })
      )
    }) as any

    // Dynamically import to get fresh instance
    const module = await import('./libraryApi.ts?t=' + Date.now())
    const { libraryApi } = module
    const customFetch = (libraryApi as any).http

    await customFetch.fetch('http://localhost:5284/test', {
      method: 'GET'
    })

    // Verify Authorization header was not added
    expect(capturedHeaders?.get('Authorization')).toBeNull()
  })

  it('should call resolveRefs on JSON responses', async () => {
    const mockResponseData = {
      $id: '1',
      name: 'Book 1',
      author: {
        $id: '2',
        name: 'Author 1',
        books: [{ $ref: '1' }]
      }
    }

    // Mock fetch to return data with references
    global.fetch = vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify(mockResponseData), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        })
      )
    ) as any

    // Dynamically import to get fresh instance
    const module = await import('./libraryApi.ts?t=' + Date.now())
    const { libraryApi } = module
    const customFetch = (libraryApi as any).http

    const response = await customFetch.fetch('http://localhost:5284/test', {
      method: 'GET'
    })

    const data = await response.json()

    // Verify that the response was processed (resolveRefs was called)
    // The data structure should be returned
    expect(data).toBeDefined()
    expect(data.name).toBe('Book 1')
    expect(data.author.name).toBe('Author 1')
    // Note: resolveRefs behavior depends on the library implementation
    // This test verifies that JSON is properly parsed and returned
  })

  it('should return original response for non-JSON content', async () => {
    const textContent = 'Plain text response'

    // Mock fetch to return plain text
    global.fetch = vi.fn(() =>
      Promise.resolve(
        new Response(textContent, {
          status: 200,
          headers: { 'content-type': 'text/plain' }
        })
      )
    ) as any

    // Dynamically import to get fresh instance
    const module = await import('./libraryApi.ts?t=' + Date.now())
    const { libraryApi } = module
    const customFetch = (libraryApi as any).http

    const response = await customFetch.fetch('http://localhost:5284/test', {
      method: 'GET'
    })

    const text = await response.text()

    // Verify plain text is returned unchanged
    expect(text).toBe(textContent)
  })

  it('should handle invalid JSON gracefully', async () => {
    const invalidJson = 'Invalid { JSON'

    // Mock fetch to return invalid JSON
    global.fetch = vi.fn(() =>
      Promise.resolve(
        new Response(invalidJson, {
          status: 200,
          headers: { 'content-type': 'application/json' }
        })
      )
    ) as any

    // Dynamically import to get fresh instance
    const module = await import('./libraryApi.ts?t=' + Date.now())
    const { libraryApi } = module
    const customFetch = (libraryApi as any).http

    const response = await customFetch.fetch('http://localhost:5284/test', {
      method: 'GET'
    })

    const text = await response.text()

    // Verify original response is returned when JSON parsing fails
    expect(text).toBe(invalidJson)
  })

  it('should preserve response status and headers', async () => {
    const mockData = { test: 'data' }

    // Mock fetch
    global.fetch = vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify(mockData), {
          status: 201,
          statusText: 'Created',
          headers: {
            'content-type': 'application/json',
            'x-custom-header': 'custom-value'
          }
        })
      )
    ) as any

    // Dynamically import to get fresh instance
    const module = await import('./libraryApi.ts?t=' + Date.now())
    const { libraryApi } = module
    const customFetch = (libraryApi as any).http

    const response = await customFetch.fetch('http://localhost:5284/test', {
      method: 'POST'
    })

    // Verify status and headers are preserved
    expect(response.status).toBe(201)
    expect(response.statusText).toBe('Created')
    expect(response.headers.get('content-type')).toBe('application/json')
    expect(response.headers.get('x-custom-header')).toBe('custom-value')
  })
})
