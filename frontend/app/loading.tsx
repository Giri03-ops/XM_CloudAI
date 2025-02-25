import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
      <div className="text-center">
        <Loader2 className="h-16 w-16 animate-spin mx-auto text-blue-600 mb-6" />
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">Loading...</h2>
        <p className="text-gray-600">Please wait while we process your request</p>
      </div>
    </div>
  )
}

