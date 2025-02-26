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
  sources: Record<string, string | string[]> // can be a single string or an array of strings
}

/**
 * Convert Markdown-style bold `**...**` to HTML <strong>...</strong>.
 */
function markdownToHTML(line: string) {
  // Replace **some text** with <strong>some text</strong>
  return line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
}

/**
 * Utility to parse multiline explanation text.
 * We detect bullet lines that start with "*   **" as bullet points,
 * and treat everything else as paragraphs.
 */
function parseExplanationText(text: string) {
  // Split by new lines, trim empty lines
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean)

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

  const handleQuizClick = () => {
    router.push("/quiz")
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
            It seems you haven&#39;t selected any topics yet or the results have been cleared.
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
          <div className="flex items-center justify-between mb-6">
            <Button onClick={handleBackClick} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Topic Selection
            </Button>
            <Button onClick={handleQuizClick} className="bg-blue-600 hover:bg-blue-700">
              Take the Quiz
            </Button>
          </div>

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
                      {/* Render paragraphs */}
                      {paragraphs.map((p, idx) => (
                        <p
                          key={idx}
                          dangerouslySetInnerHTML={{ __html: markdownToHTML(p) }}
                        />
                      ))}

                      {/* Render bullet points */}
                      {bulletPoints.length > 0 && (
                        <ul className="list-disc list-inside space-y-2">
                          {bulletPoints.map((bp, idx) => (
                            <li
                              key={idx}
                              dangerouslySetInnerHTML={{ __html: markdownToHTML(bp) }}
                            />
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

                  {/* Source Links */}
                  {results.sources[topic] && (
                    <div className="pt-4 border-t">
                      <h4 className="font-medium text-gray-800 mb-2">Sources</h4>

                      {/* If sources is a single string */}
                      {typeof results.sources[topic] === "string" && (
                        <a
                          href={results.sources[topic] as string}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-blue-600 hover:text-blue-800"
                        >
                          <span className="mr-1">{results.sources[topic]}</span>
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}

                      {/* If sources is an array */}
                      {Array.isArray(results.sources[topic]) && (
                        <ul className="list-disc list-inside space-y-2">
                          {(results.sources[topic] as string[]).map((link, i) => (
                            <li key={i}>
                              <a
                                href={link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-blue-600 hover:text-blue-800"
                              >
                                <span className="mr-1">{link}</span>
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </li>
                          ))}
                        </ul>
                      )}
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
