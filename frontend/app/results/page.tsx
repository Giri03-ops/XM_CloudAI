"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, ExternalLink, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface TopicContent {
  explanation: string
  example: string
  exam_tips: string
  common_questions: string[]
}

interface TopicResult {
  topics: string[]
  content: Record<string, TopicContent>
  sources: Record<string, string>
}

/**
 * Utility function to parse multiline explanation text
 * and detect lines that start with: "*   **Some Subtopic**"
 * We'll split them into bullet points. Everything else is a paragraph.
 */
function parseExplanationText(text: string) {
  // Split by new lines, trim empty lines
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean)

  // We'll build an array of paragraphs or bullet lists
  // For example:
  //   "A composable DXP built on cloud..." -> normal paragraph
  //   "*   **Agility and Flexibility:** Cloud-native..." -> bullet point
  const bulletPoints: string[] = []
  const paragraphs: string[] = []

  lines.forEach((line) => {
    // If line starts with "*   **", treat as a bullet subtopic
    if (line.startsWith("*   **")) {
      bulletPoints.push(line.substring(1).trim()) // remove the first '*' and trim
    } else {
      paragraphs.push(line)
    }
  })

  return { bulletPoints, paragraphs }
}

export default function ResultsPage() {
  const router = useRouter()
  const [results, setResults] = useState<TopicResult | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Retrieve the results from localStorage
    const storedResults = localStorage.getItem("topicResults")

    if (storedResults) {
      setResults(JSON.parse(storedResults))
    }

    setLoading(false)
  }, [])

  const handleBackClick = () => {
    router.push("/")
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-600 mb-4" />
          <h2 className="text-xl font-medium text-gray-800">Loading results...</h2>
        </div>
      </div>
    )
  }

  if (!results) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-6">
        <div className="max-w-4xl mx-auto text-center py-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">No Results Found</h2>
          <p className="text-gray-600 mb-6">
            It seems you haven't selected any topics yet or the results have been cleared.
          </p>
          <Button onClick={handleBackClick} className="bg-blue-600 hover:bg-blue-700">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back to Topic Selection
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <Button onClick={handleBackClick} variant="outline" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Topic Selection
          </Button>

          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6">Your Selected Topics</h1>

          {results.topics.map((topic) => {
            const topicInfo = results.content[topic]
            const { bulletPoints, paragraphs } = parseExplanationText(topicInfo.explanation)

            return (
              <div key={topic} className="mb-10 bg-white rounded-xl shadow-lg overflow-hidden">
                {/* Topic Title */}
                <div className="bg-blue-600 px-6 py-4">
                  <h2 className="text-xl font-semibold text-white">{topic}</h2>
                </div>

                <div className="p-6 space-y-6">
                  {/* Explanation */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-800 mb-2">Explanation</h3>
                    <div className="text-gray-700 space-y-3">
                      {/* Render paragraphs first */}
                      {paragraphs.map((p, idx) => (
                        <p key={idx}>{p}</p>
                      ))}

                      {/* Then render bullet points if present */}
                      {bulletPoints.length > 0 && (
                        <ul className="list-disc list-inside space-y-2">
                          {bulletPoints.map((bp, idx) => (
                            <li key={idx} dangerouslySetInnerHTML={{ __html: bp }} />
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  {/* Example */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-800 mb-2">Example</h3>
                    <p className="text-gray-700">{topicInfo.example}</p>
                  </div>

                  {/* Exam Tips */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-800 mb-2">Exam Tips</h3>
                    <p className="text-gray-700">{topicInfo.exam_tips}</p>
                  </div>

                  {/* Common Questions */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-800 mb-2">Common Questions</h3>
                    <ul className="list-disc pl-5 space-y-2 text-gray-700">
                      {topicInfo.common_questions.map((question, index) => (
                        <li key={index}>{question}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Source Link */}
                  {results.sources[topic] && (
                    <div className="pt-4 border-t">
                      <a
                        href={results.sources[topic]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-blue-600 hover:text-blue-800"
                      >
                        <span className="mr-1">Source</span>
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
