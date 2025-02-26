"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Checkbox } from "./ui/checkbox"
import { Button } from "./ui/button"
import { topicData } from "@/data/topics"
import { Loader2 } from "lucide-react"
import type { TopicResponse } from "@/types/api"

// Mock data for fallback when backend is unavailable
const mockTopicData = {
  generateResponse: (topics: string[]): TopicResponse => {
    const content: Record<
      string,
      {
        explanation: string
        example: string
        exam_tips: string
        common_questions: string[]
      }
    > = {}
    const sources: Record<string, string> = {}

    topics.forEach((topic) => {
      content[topic] = {
        explanation: `${topic} is a key concept in XM Cloud that enables developers to efficiently build and manage digital experiences.`,
        example: `When implementing ${topic}, developers typically start by understanding the requirements and then applying best practices specific to XM Cloud.`,
        exam_tips: `For the certification exam, focus on the practical applications of ${topic} and how it integrates with other XM Cloud components.`,
        common_questions: [
          `What is the purpose of ${topic} in XM Cloud?`,
          `How does ${topic} improve the development workflow?`,
          `What are common challenges when implementing ${topic}?`,
        ],
      }

      sources[topic] = `https://developers.sitecore.com/learn/${topic
        .toLowerCase()
        .replace(/\s+/g, "-")}`
    })

    return {
      topics,
      content,
      sources,
    }
  },
}

export default function TopicSelector() {
  const router = useRouter()
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleTopicChange = (topic: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic],
    )
  }

  const handleSubmit = async () => {
    if (selectedTopics.length === 0) {
      setErrorMessage("Please select at least one topic")
      return
    }

    // Turn on loading screen
    setIsLoading(true)
    setErrorMessage(null)

    // Use fallback data by default
    let data: TopicResponse = mockTopicData.generateResponse(selectedTopics)

    try {
      // Try to connect to the Flask backend with a timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      try {
        const response = await fetch("http://127.0.0.1:5000/api/topics", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ topicList: selectedTopics }),
          signal: controller.signal,
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
          throw new Error("Request to backend timed out. Using fallback data.")
        } else {
          console.warn("Fetch error:", fetchError)
          throw fetchError
        }
      }
    } catch (error: any) {
      console.error("Error details:", error)
      setErrorMessage(
        `Could not connect to backend server: ${error.message || "Unknown error"}. Using fallback data instead.`,
      )
      console.log("Using fallback data due to error")
    } finally {
      // Store the data (either from backend or fallback) in localStorage
      localStorage.setItem("topicResults", JSON.stringify(data))

      // Navigate to the results page
      router.push("/results")
    }
  }

  /**********************************************************************
   * If isLoading is true, show a full-page loading screen:
   **********************************************************************/
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
                  selectedTopics.includes(topic),
                )}
                onCheckedChange={(checked) => {
                  if (checked) {
                    // Add all topics from this category that aren't already selected
                    const topicsToAdd = category.topics.filter(
                      (topic) => !selectedTopics.includes(topic),
                    )
                    setSelectedTopics((prev) => [...prev, ...topicsToAdd])
                  } else {
                    // Remove all topics from this category
                    setSelectedTopics((prev) =>
                      prev.filter((topic) => !category.topics.includes(topic)),
                    )
                  }
                }}
                className="mt-1"
              />
              <h3
                className="font-medium text-lg text-gray-800 cursor-pointer"
                onClick={() => {
                  const allSelected = category.topics.every((topic) =>
                    selectedTopics.includes(topic),
                  )
                  if (allSelected) {
                    // Remove all topics from this category
                    setSelectedTopics((prev) =>
                      prev.filter((topic) => !category.topics.includes(topic)),
                    )
                  } else {
                    // Add all topics from this category that aren't already selected
                    const topicsToAdd = category.topics.filter(
                      (topic) => !selectedTopics.includes(topic),
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
                  <label
                    htmlFor={topic}
                    className="text-gray-700 cursor-pointer"
                  >
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
          disabled={selectedTopics.length === 0}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
        >
          Proceed
        </Button>
      </div>
    </div>
  )
}
