'use client'

export default function TestControls() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Control Test Page</h1>
      <div className="space-y-4">
        <p>Navigate to the main page to test:</p>
        <div className="bg-gray-100 p-4 rounded-lg">
          <h2 className="font-semibold mb-2">Grid Toggle Button</h2>
          <p className="text-sm text-gray-600">Look for the grid icon in the bottom-right corner. It should be blue when active, white when inactive.</p>
        </div>
        <div className="bg-gray-100 p-4 rounded-lg">
          <h2 className="font-semibold mb-2">Fullscreen/Presentation Mode</h2>
          <p className="text-sm text-gray-600">Click the maximize button in bottom-right to enter presentation mode. All UI should hide except the canvas. Exit with the button in top-right.</p>
        </div>
        <div className="mt-4">
          <a href="/" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            Go to Main App
          </a>
        </div>
      </div>
    </div>
  )
}