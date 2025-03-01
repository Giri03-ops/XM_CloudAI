"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Checkbox } from "./ui/checkbox"
import { Button } from "./ui/button"
import { topicData } from "@/data/topics"
import { Loader2 } from "lucide-react"
import type { TopicResponse } from "@/types/api"

export default function TopicSelector() {
  const router = useRouter()
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleTopicChange = (topic: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    )
  }

  const handleSubmit = async () => {
    if (selectedTopics.length === 0) {
      setErrorMessage("Please select at least one topic")
      return
    }

    setIsLoading(true)
    setErrorMessage(null)

    // We start with no data; we wait for the backend response to populate it
    let data: TopicResponse | null = null

    try {
      // Try to connect to the Flask backend with a timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      try {
        const response = await fetch("http://127.0.0.1:5000/api/topics", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // Add CORS headers if needed
            Accept: "application/json",
          },
          body: JSON.stringify({ topicList: selectedTopics }),
        })

        clearTimeout(timeoutId)

        if (response.ok) {
          const responseData = (await response.json()) as TopicResponse
          data = responseData
          console.log("Successfully received data from backend:", data)
        } else {
          console.warn("Backend returned error status:", response.status)
          throw new Error(`Server responded with status: ${response.status}`)
        }
      } catch (fetchError: any) {
        clearTimeout(timeoutId)

        if (fetchError.name === "AbortError") {
          console.warn("Request timed out")
          throw new Error("Request to backend timed out.")
        } else {
          console.warn("Fetch error:", fetchError)
          throw fetchError
        }
      }
    } catch (error: any) {
      console.error("Error details:", error)

      // Set a user-friendly error message
      setErrorMessage(error.message || "Unknown error")
    } finally {
      // If we got valid data, store it and push to results
      if (data) {
        localStorage.setItem("topicResults", JSON.stringify(data))

        // If no error, go straight to results
        if (!errorMessage) {
          setIsLoading(false)
          router.push("/results")
        } else {
          // If there was an error message along with data, wait 2 seconds then push
          setTimeout(() => {
            setIsLoading(false)
            router.push("/results")
          }, 2000)
        }
      } else {
        // If there's no data (e.g. error or timeout occurred), we stop loading
        setIsLoading(false)
      }
    }
  }

  // If isLoading is true, show a full-page loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-600 mb-4" />
          <h2 className="text-xl font-medium text-gray-800">
            Generating content for the topics...
          </h2>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          XM Cloud Syllabus
        </h2>
        <p className="text-gray-600 mb-4">
          Select the topics you want to learn more about:
        </p>
      </div>

      {errorMessage && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
          {errorMessage}
        </div>
      )}

      <div className="space-y-6">
        {topicData.map((category) => (
          <div key={category.title} className="border-b pb-4 last:border-b-0">
            <div className="flex items-center space-x-3 mb-3">
              <Checkbox
                id={`select-all-${category.title}`}
                checked={category.topics.every((topic) =>
                  selectedTopics.includes(topic)
                )}
                onCheckedChange={(checked) => {
                  if (checked) {
                    // Add all topics from this category that aren't selected
                    const topicsToAdd = category.topics.filter(
                      (topic) => !selectedTopics.includes(topic)
                    )
                    setSelectedTopics((prev) => [...prev, ...topicsToAdd])
                  } else {
                    // Remove all topics from this category
                    setSelectedTopics((prev) =>
                      prev.filter((topic) => !category.topics.includes(topic))
                    )
                  }
                }}
                className="mt-1"
              />
              <h3
                className="font-medium text-lg text-gray-800 cursor-pointer"
                onClick={() => {
                  const allSelected = category.topics.every((topic) =>
                    selectedTopics.includes(topic)
                  )
                  if (allSelected) {
                    setSelectedTopics((prev) =>
                      prev.filter((topic) => !category.topics.includes(topic))
                    )
                  } else {
                    const topicsToAdd = category.topics.filter(
                      (topic) => !selectedTopics.includes(topic)
                    )
                    setSelectedTopics((prev) => [...prev, ...topicsToAdd])
                  }
                }}
              >
                {category.title}
              </h3>
            </div>
            <div className="space-y-3 pl-2">
              {category.topics.map((topic) => (
                <div key={topic} className="flex items-start space-x-3">
                  <Checkbox
                    id={topic}
                    checked={selectedTopics.includes(topic)}
                    onCheckedChange={() => handleTopicChange(topic)}
                    className="mt-1"
                  />
                  <label htmlFor={topic} className="text-gray-700 cursor-pointer">
                    {topic}
                  </label>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={isLoading || selectedTopics.length === 0}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
        >
          Proceed
        </Button>
      </div>
    </div>
  )
}
