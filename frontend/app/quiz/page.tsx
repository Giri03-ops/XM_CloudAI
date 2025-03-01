"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import type { QuizResponse, QuizState } from "@/types/quiz"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabaseClient" // Import supabase client

export default function QuizPage() {
  const router = useRouter()
  const [quizData, setQuizData] = useState<QuizResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [quizState, setQuizState] = useState<QuizState>({
    currentAnswers: {},
    isSubmitted: false,
  })
  const [wittyMessages] = useState([
    "🤖 Don't worry, AGI won't take over the world...",
    "🎓 You will definitely pass XM_Cloud certification!",
    "🧠 Analyzing your topic knowledge...",
    "🔍 Preparing challenging questions just for you...",
    "💡 Fun fact: Sitecore was founded in 2001 in Denmark",
    "☕ Brewing the perfect quiz experience...",
    "⏳ Loading brain-teasing questions...",
    "🤔 Remember: The answer is always 'headless architecture'... or is it?",
    "✨ Tip: Read each question carefully before answering",
  ])

  const [currentMessage, setCurrentMessage] = useState(0)
  const fetchDone = useRef(false) // Flag to prevent duplicate fetches

  useEffect(() => {
    // Prevent multiple fetches even if the component re-renders
    if (fetchDone.current) return
    fetchDone.current = true

    const fetchQuiz = async () => {
      try {
        const storedResults = localStorage.getItem("topicResults")
        if (!storedResults) {
          throw new Error("No topics selected")
        }

        const { topics } = JSON.parse(storedResults)
        const response = await fetch("http://127.0.0.1:5000/api/quiz/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ topicList: topics }),
        })

        if (!response.ok) {
          throw new Error("Failed to fetch quiz")
        }

        const data = await response.json()
        setQuizData(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong")
      } finally {
        setLoading(false)
      }
    }

    fetchQuiz()
  }, [])

  const handleAnswerChange = (questionIndex: number, answer: string) => {
    if (quizState.isSubmitted) return

    setQuizState((prev) => ({
      ...prev,
      currentAnswers: {
        ...prev.currentAnswers,
        [questionIndex]: answer,
      },
    }))
  }

  const handleSubmit = async () => {
    if (!quizData) return

    // Compute per-topic scores
    const topicScores: Record<string, { correct: number; total: number }> = {}
    quizData.questions.forEach((q, index) => {
      const topic = q.topic
      if (!topicScores[topic]) {
        topicScores[topic] = { correct: 0, total: 0 }
      }
      topicScores[topic].total += 1
      if (quizState.currentAnswers[index] === q.correct_answer) {
        topicScores[topic].correct += 1
      }
    })

    // Compute overall score for display
    const overallCorrect = Object.values(topicScores).reduce((sum, { correct }) => sum + correct, 0)
    const overallTotal = Object.values(topicScores).reduce((sum, { total }) => sum + total, 0)

    // Update quiz state with overall score
    setQuizState((prev) => ({
      ...prev,
      isSubmitted: true,
      score: {
        correct: overallCorrect,
        total: overallTotal,
      },
    }))

    // Prepare payload for Supabase: one record per topic
    try {
      // Replace with actual user email or get from auth context
      const userEmail = "giri.chettiar@gmail.com"

      const payload = Object.entries(topicScores).map(([topic, { correct, total }]) => ({
        user_email: userEmail,
        topic: topic,
        score: correct,
        total_questions: total,
        // created_at will be handled by Supabase if the column has a default value
      }))

      const { data, error } = await supabase
        .from("quiz_attempts")
        .insert(payload)
        .select()

      if (error) {
        console.error("Error saving quiz results:", error)
      } else {
        console.log("Quiz results saved successfully:", data)
      }
    } catch (err) {
      console.error("Unexpected error saving quiz results:", err)
    }
  }

  const handleBack = () => {
    router.push("/results")
  }

  const handleRetry = async () => {
    if (!quizData) return

    setLoading(true)
    try {
      const response = await fetch("http://127.0.0.1:5000/api/quiz/recheck", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          existingQuiz: quizData,          // The entire existing quiz object
          userAnswers: quizState.currentAnswers, // The user's answers
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to recheck quiz")
      }

      const data = await response.json()
      // Update state with the new "rechecked" quiz data
      setQuizData(data)

      // Reset quiz state for a fresh attempt
      setQuizState({
        currentAnswers: {},
        isSubmitted: false,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessage((prev) => (prev + 1) % wittyMessages.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [wittyMessages])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
        <div className="text-center max-w-md mx-auto p-6">
          <Loader2 className="h-16 w-16 animate-spin mx-auto text-blue-600 mb-6" />
          <h2 className="text-2xl font-medium text-gray-800 mb-4">Generating your quiz...</h2>
          <div className="h-20">
            <p className="text-gray-600 italic transition-opacity duration-500">
              &quot;{wittyMessages[currentMessage]}&quot;
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-6">
        <div className="max-w-4xl mx-auto text-center py-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={handleBack} className="bg-blue-600 hover:bg-blue-700">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Results
          </Button>
        </div>
      </div>
    )
  }

  if (!quizData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-6">
        <div className="max-w-4xl mx-auto text-center py-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">No Quiz Available</h2>
          <p className="text-gray-600 mb-6">Please select topics before taking the quiz.</p>
          <Button onClick={handleBack} className="bg-blue-600 hover:bg-blue-700">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Results
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <Button onClick={handleBack} variant="outline" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Results
          </Button>

          <Card className="p-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Test Your Knowledge</h1>

            {/* Show score if user has submitted */}
            {quizState.isSubmitted && quizState.score && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h2 className="text-xl font-semibold mb-2">Quiz Results</h2>
                <p className="text-lg">
                  You got{" "}
                  <span className="font-bold text-blue-600">{quizState.score.correct}</span> out of{" "}
                  <span className="font-bold">{quizState.score.total}</span> questions correct!
                </p>
              </div>
            )}

            <div className="space-y-8">
              {quizData.questions.map((question, index) => (
                <div key={index} className="border-b pb-6 last:border-b-0">
                  <h3 className="text-lg font-medium mb-4">
                    {index + 1}. {question.question}
                  </h3>
                  <RadioGroup
                    value={quizState.currentAnswers[index] || ""}
                    onValueChange={(value) => handleAnswerChange(index, value)}
                    className="space-y-3"
                  >
                    {question.options.map((option) => {
                      const isCorrect = option === question.correct_answer
                      const isSelected = quizState.currentAnswers[index] === option
                      const showCorrect = quizState.isSubmitted && isCorrect
                      const showIncorrect = quizState.isSubmitted && isSelected && !isCorrect

                      return (
                        <div
                          key={option}
                          className={cn(
                            "flex items-center space-x-2 rounded-lg border p-4 transition-colors",
                            showCorrect && "bg-green-50 border-green-200",
                            showIncorrect && "bg-red-50 border-red-200"
                          )}
                        >
                          <RadioGroupItem
                            value={option}
                            id={`q${index}-${option}`}
                            disabled={quizState.isSubmitted}
                          />
                          <Label htmlFor={`q${index}-${option}`} className="flex-grow cursor-pointer">
                            {option}
                          </Label>
                          {showCorrect && <span className="text-green-600 text-sm">Correct Answer</span>}
                          {showIncorrect && <span className="text-red-600 text-sm">Incorrect</span>}
                        </div>
                      )
                    })}
                  </RadioGroup>
                </div>
              ))}
            </div>

            {!quizState.isSubmitted && (
              <Button
                onClick={handleSubmit}
                className="w-full mt-8 bg-blue-600 hover:bg-blue-700"
                disabled={Object.keys(quizState.currentAnswers).length !== quizData.questions.length}
              >
                Submit Quiz
              </Button>
            )}

            {quizState.isSubmitted && (
              <Button onClick={handleRetry} className="w-full mt-4 bg-blue-600 hover:bg-blue-700">
                Retry Quiz
              </Button>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
