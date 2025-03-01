"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient" // <-- Make sure this path is correct
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  BarChart,
  CheckCircle2,
  XCircle,
  Trophy,
  BookOpen,
  Timer,

  Loader2,
  ArrowRight,
} from "lucide-react"
import { topicData } from "@/data/topics" // <-- For total # of topics

/**
 * The shape of each quiz attempt in the "quiz_attempts" table
 */
interface QuizAttempt {
  id: string
  user_email: string
  topic: string
  score: number
  total_questions: number
  created_at: string // date-time string
}

/**
 * We'll store per-topic stats in this shape
 */
interface TopicProgress {
  topic: string
  attempts: number
  averageScore: number
  lastAttempt: string
}

export default function DashboardPage() {
  const router = useRouter()

  // Loading & data states
  const [isLoading, setIsLoading] = useState(true)
  const [attempts, setAttempts] = useState<QuizAttempt[]>([])

  // Computed states
  const [topicProgress, setTopicProgress] = useState<TopicProgress[]>([])
  const [overallProgress, setOverallProgress] = useState(0)
  const [recentAttempts, setRecentAttempts] = useState<QuizAttempt[]>([])
  const [strongestTopics, setStrongestTopics] = useState<TopicProgress[]>([])

  // For "Performance Summary"
  const [correctPercentage, setCorrectPercentage] = useState(0)
  const [incorrectPercentage, setIncorrectPercentage] = useState(0)

  // Fetch attempts from Supabase
  useEffect(() => {
    async function fetchAttempts() {
      try {
        const { data, error } = await supabase
          .from("quiz_attempts")
          .select("*")
          .eq("user_email", "giri.chettiar@gmail.com")
          .order("created_at", { ascending: false })

        if (error) {
          console.error("Error fetching attempts:", error)
          setIsLoading(false)
          return
        }

        if (data) {
          setAttempts(data)
        }
      } catch (err) {
        console.error("Unexpected error:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAttempts()
  }, [])

  // Compute stats after "attempts" is loaded
  useEffect(() => {
    if (attempts.length === 0) {
      // If no attempts, everything is 0 or empty
      setOverallProgress(0)
      setTopicProgress([])
      setRecentAttempts([])
      setCorrectPercentage(0)
      setIncorrectPercentage(0)
      setStrongestTopics([])
      return
    }

    // 1) Overall progress = total correct / total questions
    const totalScore = attempts.reduce((acc, a) => acc + a.score, 0)
    const totalQuestions = attempts.reduce((acc, a) => acc + a.total_questions, 0)
    const overall = totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0
    setOverallProgress(overall)

    // 2) Group attempts by topic, compute average, attempts, last date, etc.
    const topicMap: Record<string, QuizAttempt[]> = {}
    for (const a of attempts) {
      if (!topicMap[a.topic]) {
        topicMap[a.topic] = []
      }
      topicMap[a.topic].push(a)
    }

    const tProgress: TopicProgress[] = Object.entries(topicMap).map(([topic, arr]) => {
      const tScore = arr.reduce((acc, a) => acc + a.score, 0)
      const tTotal = arr.reduce((acc, a) => acc + a.total_questions, 0)
      const avgScore = tTotal > 0 ? Math.round((tScore / tTotal) * 100) : 0
      const lastAttemptDate = arr[0]?.created_at.split("T")[0] ?? ""
      return {
        topic,
        attempts: arr.length,
        averageScore: avgScore,
        lastAttempt: lastAttemptDate,
      }
    })

    setTopicProgress(tProgress)

    // 3) Recent attempts (first 5 by created_at descending)
    const recent = attempts.slice(0, 5)
    setRecentAttempts(recent)

    // 4) Performance summary: correct vs. incorrect
    //    correct = totalScore, incorrect = totalQuestions - totalScore
    //    Then convert to percentages of totalQuestions
    if (totalQuestions > 0) {
      const correctPct = Math.round((totalScore / totalQuestions) * 100)
      const incorrectPct = 100 - correctPct
      setCorrectPercentage(correctPct)
      setIncorrectPercentage(incorrectPct)
    }

    // 5) Strongest topics: top 3 sorted by averageScore descending
    const strongest = [...tProgress].sort((a, b) => b.averageScore - a.averageScore).slice(0, 3)
    setStrongestTopics(strongest)
  }, [attempts])

  // Now we can compute "Topics Covered" from topicData
  // i.e. how many topics from topicData actually appear in attempts?
  const allTopicTitles = topicData.map((cat) => cat.title) // e.g. an array of category titles
  // If your quiz stores the "topic" as a category title, you can see how many unique ones appear in attempts.
  const coveredTopicTitles = topicProgress.map((t) => t.topic)
  const coveredCount = coveredTopicTitles.filter((title) => allTopicTitles.includes(title)).length
  const totalTopics = allTopicTitles.length

  // Total attempts across all topics
  const totalAttempts = topicProgress.reduce((acc, curr) => acc + curr.attempts, 0)

  // Loading UI
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-600 mb-4" />
          <h2 className="text-xl font-medium text-gray-800">Loading your progress...</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Top Buttons */}
          <div className="flex justify-between items-center mb-8">
            <Button onClick={() => router.push("/topic")} variant="outline">
              <ArrowRight className="mr-2 h-4 w-4" />
              Select a topic
            </Button>
          </div>

          {/* Overall Progress, Topics Covered, Avg Score, Total Attempts */}
          <div className="grid gap-6 mb-8 md:grid-cols-4">
            {/* Overall Progress */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Trophy className="h-8 w-8 text-yellow-500" />
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Overall Progress</p>
                    <p className="text-2xl font-bold">{overallProgress}%</p>
                  </div>
                </div>
                <Progress value={overallProgress} className="h-2" />
              </CardContent>
            </Card>

            {/* Topics Covered */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <BookOpen className="h-8 w-8 text-blue-500" />
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Topics Covered</p>
                    <p className="text-2xl font-bold">
                      {coveredCount}/{totalTopics}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Avg. Score */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <BarChart className="h-8 w-8 text-green-500" />
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Avg. Score</p>
                    <p className="text-2xl font-bold">
                      {
                        // If no attempts, overallProgress is 0, so you can reuse that
                      }
                      {overallProgress}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total Attempts */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <Timer className="h-8 w-8 text-purple-500" />
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Total Attempts</p>
                    <p className="text-2xl font-bold">{totalAttempts}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Middle Section: Topic Progress & Recent Attempts */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Topic Progress */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Topic Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {topicProgress.length === 0 ? (
                    <p className="text-gray-500">No topics attempted yet.</p>
                  ) : (
                    topicProgress.map((topic) => (
                      <div key={topic.topic} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{topic.topic}</p>
                            <p className="text-sm text-gray-500">
                              {topic.attempts} attempts • Last attempt: {topic.lastAttempt}
                            </p>
                          </div>
                          <span className="font-bold">{topic.averageScore}%</span>
                        </div>
                        <Progress value={topic.averageScore} className="h-2" />
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Attempts */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Attempts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentAttempts.length === 0 ? (
                    <p className="text-gray-500">No recent attempts found.</p>
                  ) : (
                    recentAttempts.map((attempt) => {
                      const attemptScore = Math.round(
                        (attempt.score / attempt.total_questions) * 100
                      )
                      return (
                        <div
                          key={attempt.id}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                        >
                          <div>
                            <p className="font-medium">{attempt.topic}</p>
                            <p className="text-sm text-gray-500">
                              {attempt.created_at.split("T")[0]}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="text-right">
                              <p className="font-bold">{attemptScore}%</p>
                              <p className="text-sm text-gray-500">
                                {attempt.score}/{attempt.total_questions}
                              </p>
                            </div>
                            {attempt.score === attempt.total_questions ? (
                              <CheckCircle2 className="h-5 w-5 text-green-500" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-500" />
                            )}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Performance Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Correct vs Incorrect */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                        <span className="text-xl font-bold text-green-600">
                          {correctPercentage}%
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">Correct Answers</p>
                    </div>
                    <div className="p-4 bg-red-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <XCircle className="h-5 w-5 text-red-500" />
                        <span className="text-xl font-bold text-red-600">
                          {incorrectPercentage}%
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">Incorrect Answers</p>
                    </div>
                  </div>

                  {/* Strongest Topics */}
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Strongest Topics</h4>
                    {strongestTopics.length === 0 ? (
                      <p className="text-gray-500">No topics attempted yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {strongestTopics.map((t) => (
                          <div
                            key={t.topic}
                            className="flex items-center justify-between"
                          >
                            <p className="text-sm">{t.topic}</p>
                            <span className="text-sm font-medium">
                              {t.averageScore}%
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
