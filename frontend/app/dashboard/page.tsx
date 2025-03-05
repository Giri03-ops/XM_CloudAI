"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  BarChart,
  CheckCircle2,
  XCircle,
  Trophy,
  BookOpen,
  Timer,
  Target,
  TrendingUp,
  TrendingDown,
  Calendar,
  RefreshCw,
  Loader2,
  Flame,
  AlertTriangle,
  Award,
  ChevronRight,
} from "lucide-react"
import { topicData } from "@/data/topics"

// Define interfaces
interface QuizAttempt {
  id: string
  user_email: string
  topic: string
  score: number
  total_questions: number
  created_at: string
}

interface TopicProgress {
  topic: string
  attempts: number
  averageScore: number
  lastAttempt: string
  trend: number
}

interface TopicContent {
  title: string
  content: string
}

interface TopicResult {
  topics: string[]
  content: Record<string, TopicContent>
  sources: Record<string, string | string[]>
}

export default function DashboardPage() {
  const router = useRouter()
  
  // States
  const [isLoading, setIsLoading] = useState(true)
  const [attempts, setAttempts] = useState<QuizAttempt[]>([])
  const [timeFilter, setTimeFilter] = useState("all") // 'week', 'month', 'all'
  const [topicProgress, setTopicProgress] = useState<TopicProgress[]>([])
  const [overallProgress, setOverallProgress] = useState(0)
  const [recentAttempts, setRecentAttempts] = useState<QuizAttempt[]>([])
  const [weakestTopics, setWeakestTopics] = useState<TopicProgress[]>([])
  const [strongestTopics, setStrongestTopics] = useState<TopicProgress[]>([])
  const [correctPercentage, setCorrectPercentage] = useState(0)
  const [incorrectPercentage, setIncorrectPercentage] = useState(0)
  const [progressTrend, setProgressTrend] = useState(0)
  const [activeTab, setActiveTab] = useState("overview")
  
  // Handle topic selection and redirection
  const handleTopicSelect = (topic: string) => {
    // Find the main category that contains this topic
    const mainCategory = topicData.find(category => 
      category.topics.includes(topic) || category.title === topic
    );
    
    // If it's a main category title, we need to set up the topicResults with all subtopics
    if (mainCategory) {
      const topicResult: TopicResult = {
        topics: mainCategory.topics,
        content: {},
        sources: {}
      };
      
      // Store in localStorage for quiz page to access
      localStorage.setItem("topicResults", JSON.stringify(topicResult));
      
      // Navigate to quiz page
      router.push("/quiz");
    } else {
      // If it's a subtopic, find its parent category
      const parentCategory = topicData.find(category => 
        category.topics.includes(topic)
      );
      
      if (parentCategory) {
        // Create a topicResult with just this specific subtopic
        const topicResult: TopicResult = {
          topics: [topic],
          content: {},
          sources: {}
        };
        
        localStorage.setItem("topicResults", JSON.stringify(topicResult));
        router.push("/quiz");
      } else {
        // Fallback to topic page if we can't determine the structure
        router.push("/topic");
      }
    }
  };
  
  // Navigate to topic selection page
  const goToTopicPage = () => {
    router.push("/topic");
  };
  
  // Fetch data
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

  // Filter attempts based on time selection
  const filteredAttempts = useMemo(() => {
    if (timeFilter === "all") return attempts
    
    const now = new Date()
    const cutoffDate = new Date()
    
    if (timeFilter === "week") {
      cutoffDate.setDate(now.getDate() - 7)
    } else if (timeFilter === "month") {
      cutoffDate.setMonth(now.getMonth() - 1)
    }
    
    return attempts.filter(a => new Date(a.created_at) >= cutoffDate)
  }, [attempts, timeFilter])

  // Compute stats based on filtered attempts
  useEffect(() => {
    if (filteredAttempts.length === 0) {
      // Reset everything if no attempts
      setOverallProgress(0)
      setTopicProgress([])
      setRecentAttempts([])
      setWeakestTopics([])
      setStrongestTopics([])
      setCorrectPercentage(0)
      setIncorrectPercentage(0)
      setProgressTrend(0)
      return
    }

    // Overall progress
    const totalScore = filteredAttempts.reduce((acc, a) => acc + a.score, 0)
    const totalQuestions = filteredAttempts.reduce((acc, a) => acc + a.total_questions, 0)
    const overall = totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0
    setOverallProgress(overall)

    // Group attempts by topic with chronological order to calculate trends
    const topicMap: Record<string, QuizAttempt[]> = {}
    for (const a of filteredAttempts) {
      if (!topicMap[a.topic]) {
        topicMap[a.topic] = []
      }
      topicMap[a.topic].push(a)
    }

    const tProgress: TopicProgress[] = Object.entries(topicMap).map(([topic, arr]) => {
      // Sort by date for trend calculation
      const sortedAttempts = [...arr].sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
      
      const tScore = arr.reduce((acc, a) => acc + a.score, 0)
      const tTotal = arr.reduce((acc, a) => acc + a.total_questions, 0)
      const avgScore = tTotal > 0 ? Math.round((tScore / tTotal) * 100) : 0
      const lastAttemptDate = arr[0]?.created_at.split("T")[0] ?? ""
      
      // Calculate trend (if we have multiple attempts)
      let trend = 0
      if (sortedAttempts.length >= 2) {
        // Compare first and last attempt
        const firstScore = sortedAttempts[0].score / sortedAttempts[0].total_questions
        const lastScore = sortedAttempts[sortedAttempts.length - 1].score / sortedAttempts[sortedAttempts.length - 1].total_questions
        trend = Math.round((lastScore - firstScore) * 100)
      }
      
      return {
        topic,
        attempts: arr.length,
        averageScore: avgScore,
        lastAttempt: lastAttemptDate,
        trend
      }
    })

    setTopicProgress(tProgress)
    
    // Calculate overall trend
    if (filteredAttempts.length >= 2) {
      // Sort attempts chronologically
      const sortedAttempts = [...filteredAttempts].sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
      
      // Take first 3 and last 3 attempts for trend calculation (or less if not enough)
      const firstAttempts = sortedAttempts.slice(0, Math.min(3, sortedAttempts.length))
      const lastAttempts = sortedAttempts.slice(Math.max(0, sortedAttempts.length - 3))
      
      const firstAvg = firstAttempts.reduce((acc, a) => acc + (a.score / a.total_questions), 0) / firstAttempts.length
      const lastAvg = lastAttempts.reduce((acc, a) => acc + (a.score / a.total_questions), 0) / lastAttempts.length
      
      setProgressTrend(Math.round((lastAvg - firstAvg) * 100))
    }

    // Recent 5 attempts
    setRecentAttempts(filteredAttempts.slice(0, 5))

    // Correct/incorrect percentages
    if (totalQuestions > 0) {
      const correctPct = Math.round((totalScore / totalQuestions) * 100)
      const incorrectPct = 100 - correctPct
      setCorrectPercentage(correctPct)
      setIncorrectPercentage(incorrectPct)
    }

    // Strongest topics: top 3 by averageScore
    const strongest = [...tProgress].sort((a, b) => b.averageScore - a.averageScore).slice(0, 3)
    setStrongestTopics(strongest)
    
    // Weakest topics: bottom 3 by averageScore (with at least one attempt)
    const weakest = [...tProgress].sort((a, b) => a.averageScore - b.averageScore).slice(0, 3)
    setWeakestTopics(weakest)
  }, [filteredAttempts])

  // Get all topic titles from topicData (main categories)
  const allMainTopics = topicData.map((cat) => cat.title)
  
  // Extract all subtopics too, for matching with attempts
  const allSubtopics = topicData.flatMap(category => category.topics)
  
  // All possible topics (both main categories and subtopics)
  const allPossibleTopics = [...allMainTopics, ...allSubtopics]
  
  // Find covered topics
  const coveredTopicTitles = topicProgress.map((t) => t.topic)
  const coveredCount = coveredTopicTitles.filter((title) => allPossibleTopics.includes(title)).length
  
  // Total number of all topics and subtopics
  const totalTopics = allPossibleTopics.length
  
  // Total attempts across all topics
  const totalAttempts = topicProgress.reduce((acc, curr) => acc + curr.attempts, 0)

  // Generate recommended topic to practice (the weakest one with attempts)
  const recommendedTopic = weakestTopics.length > 0 ? weakestTopics[0].topic : 
                          (allSubtopics.find(t => !coveredTopicTitles.includes(t)) || allMainTopics[0])

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
          {/* Header with time filter */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Your Learning Dashboard</h1>
              <p className="text-gray-600">Track your progress and identify areas for improvement</p>
            </div>
            <div className="flex space-x-4 items-center">
              <Select value={timeFilter} onValueChange={setTimeFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Time period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All time</SelectItem>
                  <SelectItem value="month">Last month</SelectItem>
                  <SelectItem value="week">Last week</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={goToTopicPage} variant="default">
                <BookOpen className="mr-2 h-4 w-4" />
                Practice Now
              </Button>
            </div>
          </div>

          {/* Tabs for different dashboard views */}
          <Tabs defaultValue="overview" className="mb-8" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 mb-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="topics">Topic Analysis</TabsTrigger>
              <TabsTrigger value="history">Attempt History</TabsTrigger>
            </TabsList>
            
            {/* Overview Tab */}
            <TabsContent value="overview">
              {/* Top Stats Cards */}
              <div className="grid gap-6 mb-8 md:grid-cols-4">
                {/* Overall Progress */}
                <Card className="relative overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <Trophy className="h-8 w-8 text-yellow-500" />
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Overall Progress</p>
                        <div className="flex items-center">
                          <p className="text-2xl font-bold">{overallProgress}%</p>
                          {progressTrend !== 0 && (
                            <span className={`ml-2 flex items-center text-sm ${progressTrend > 0 ? "text-green-500" : "text-red-500"}`}>
                              {progressTrend > 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                              {Math.abs(progressTrend)}%
                            </span>
                          )}
                        </div>
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
                    <Progress value={(coveredCount / totalTopics) * 100} className="h-2 mt-4" />
                  </CardContent>
                </Card>

                {/* Avg. Score */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <BarChart className="h-8 w-8 text-green-500" />
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Avg. Score</p>
                        <p className="text-2xl font-bold">{overallProgress}%</p>
                      </div>
                    </div>
                    <div className="flex justify-between mt-4 text-sm">
                      <span className="text-green-600">{correctPercentage}% Correct</span>
                      <span className="text-red-600">{incorrectPercentage}% Wrong</span>
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
                    <p className="text-sm text-gray-500 mt-4">
                      Last attempt: {recentAttempts[0]?.created_at.split("T")[0] || "Never"}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Middle Section: Strengths & Weaknesses + Recommendation */}
              <div className="grid gap-6 mb-8 md:grid-cols-3">
                {/* Strongest Topics */}
                <Card className="bg-gradient-to-br from-green-50 to-white">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Award className="h-5 w-5 text-green-500 mr-2" />
                      Your Strengths
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {strongestTopics.length === 0 ? (
                      <p className="text-gray-500">No topics attempted yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {strongestTopics.map((t) => (
                          <div key={t.topic} className="bg-white rounded-lg p-3 shadow-sm">
                            <div className="flex justify-between items-center mb-1">
                              <p className="font-medium">{t.topic}</p>
                              <span className="font-bold text-green-600">{t.averageScore}%</span>
                            </div>
                            <Progress value={t.averageScore} className="h-2" />
                            <div className="flex justify-between items-center mt-2">
                              <p className="text-xs text-gray-500">{t.attempts} attempts</p>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-7 text-xs"
                                onClick={() => handleTopicSelect(t.topic)}
                              >
                                Practice Again
                                <ChevronRight className="h-3 w-3 ml-1" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Weakest Topics */}
                <Card className="bg-gradient-to-br from-red-50 to-white">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <AlertTriangle className="h-5 w-5 text-orange-500 mr-2" />
                      Areas to Improve
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {weakestTopics.length === 0 ? (
                      <p className="text-gray-500">No topics attempted yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {weakestTopics.map((t) => (
                          <div key={t.topic} className="bg-white rounded-lg p-3 shadow-sm">
                            <div className="flex justify-between items-center mb-1">
                              <p className="font-medium">{t.topic}</p>
                              <span className="font-bold text-orange-600">{t.averageScore}%</span>
                            </div>
                            <Progress value={t.averageScore} className="h-2" />
                            <div className="flex justify-between items-center mt-2">
                              <p className="text-xs text-gray-500">{t.attempts} attempts</p>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-7 text-xs text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                onClick={() => handleTopicSelect(t.topic)}
                              >
                                Practice Now
                                <ChevronRight className="h-3 w-3 ml-1" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Recommended Practice */}
                <Card className="bg-gradient-to-br from-blue-50 to-white">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Target className="h-5 w-5 text-blue-500 mr-2" />
                      Recommended Next Step
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      {recommendedTopic ? (
                        <>
                          <h3 className="font-medium text-lg mb-2">Practice this topic:</h3>
                          <div className="bg-blue-100 text-blue-800 font-medium p-3 rounded-md mb-4 text-center">
                            {recommendedTopic}
                          </div>
                          <p className="text-sm text-gray-600 mb-4">
                            {weakestTopics.length > 0 
                              ? "This is your weakest topic. Focus here to improve your overall score."
                              : "You haven't tried this topic yet. Explore it to expand your knowledge."}
                          </p>
                          <Button 
                            className="w-full" 
                            onClick={() => handleTopicSelect(recommendedTopic)}
                          >
                            <Flame className="mr-2 h-4 w-4" />
                            Start Practice
                          </Button>
                        </>
                      ) : (
                        <p className="text-gray-600">Complete your first quiz to get recommendations.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentAttempts.length === 0 ? (
                      <div className="text-center py-8">
                        <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No recent activity. Take your first quiz!</p>
                        <Button className="mt-4" onClick={goToTopicPage}>
                          Start a Quiz
                        </Button>
                      </div>
                    ) : (
                      recentAttempts.map((attempt) => {
                        const attemptScore = Math.round(
                          (attempt.score / attempt.total_questions) * 100
                        )
                        const isGood = attemptScore >= 70;
                        return (
                          <div
                            key={attempt.id}
                            className={`flex items-center justify-between p-4 rounded-lg border ${
                              isGood ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
                            }`}
                          >
                            <div>
                              <p className="font-medium">{attempt.topic}</p>
                              <p className="text-sm text-gray-500">
                                {new Date(attempt.created_at).toLocaleString()}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="text-right">
                                <p className={`font-bold ${isGood ? "text-green-600" : "text-red-600"}`}>
                                  {attemptScore}%
                                </p>
                                <p className="text-sm text-gray-500">
                                  {attempt.score}/{attempt.total_questions}
                                </p>
                              </div>
                              {isGood ? (
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
            </TabsContent>
            
            {/* Topics Tab */}
            <TabsContent value="topics">
              <Card>
                <CardHeader>
                  <CardTitle>Topic Performance Analysis</CardTitle>
                  <CardDescription>
                    Review your performance across all topics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {topicProgress.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No topics attempted yet.</p>
                    ) : (
                      topicProgress.sort((a, b) => b.averageScore - a.averageScore).map((topic) => (
                        <div key={topic.topic} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium">{topic.topic}</p>
                              <p className="text-sm text-gray-500">
                                {topic.attempts} attempts • Last: {topic.lastAttempt}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center">
                                <span className="font-bold">{topic.averageScore}%</span>
                                {topic.trend !== 0 && (
                                  <span className={`ml-2 flex items-center text-xs ${topic.trend > 0 ? "text-green-500" : "text-red-500"}`}>
                                    {topic.trend > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                                    {Math.abs(topic.trend)}%
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <Progress value={topic.averageScore} className="h-2 flex-grow" />
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="ml-3"
                              onClick={() => handleTopicSelect(topic.topic)}
                            >
                              Practice
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full" onClick={goToTopicPage}>
                    <BookOpen className="mr-2 h-4 w-4" />
                    Explore All Topics
                  </Button>
                </CardFooter>
              </Card>
              
              {/* Topics Not Attempted */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Categories to Explore</CardTitle>
                  <CardDescription>
                    Discover topics you haven&apos;t attempted yet
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4">
                    {topicData.map(category => {
                      // Check if any subtopics have been attempted
                      const attemptedSubtopics = category.topics.filter(topic => 
                        coveredTopicTitles.includes(topic)
                      );
                      
                      // Calculate overall category completion percentage
                      const completionPercentage = category.topics.length > 0 
                        ? Math.round((attemptedSubtopics.length / category.topics.length) * 100)
                        : 0;
                        
                      return (
                        <div key={category.title} className="border rounded-lg p-4">
                          <div className="flex justify-between items-center mb-2">
                            <h3 className="font-medium">{category.title}</h3>
                            <span className="text-sm text-gray-500">
                              {attemptedSubtopics.length}/{category.topics.length} topics
                            </span>
                          </div>
                          <Progress value={completionPercentage} className="h-2 mb-3" />
                          
                          {/* Display subtopics */}
                          <div className="mt-3 space-y-2">
                            {category.topics.map(topic => {
                              const isAttempted = coveredTopicTitles.includes(topic);
                              const topicStats = topicProgress.find(t => t.topic === topic);
                              
                              return (
                                <div key={topic} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded">
                                  <div className="flex-1">
                                    <p className={isAttempted ? "font-medium" : ""}>
                                      {topic}
                                    </p>
                                    {isAttempted && topicStats && (
                                      <p className="text-xs text-gray-500">
                                        Score: {topicStats.averageScore}% • {topicStats.attempts} attempts
                                      </p>
                                    )}
                                  </div>
                                  <Button 
                                    size="sm" 
                                    variant={isAttempted ? "ghost" : "outline"}
                                    className={isAttempted ? "text-blue-600" : ""}
                                    onClick={() => handleTopicSelect(topic)}
                                  >
                                    {isAttempted ? "Practice Again" : "Try"}
                                  </Button>
                                </div>
                              );
                            })}
                          </div>
                          
                          <div className="mt-4 flex justify-end">
                            <Button 
                              variant="secondary"
                              size="sm"
                              onClick={() => handleTopicSelect(category.title)}
                            >
                              Practice All Topics in Category
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* History Tab */}
            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle>Quiz Attempt History</CardTitle>
                  <CardDescription>
                    Review all your previous quiz attempts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {filteredAttempts.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No attempt history found.</p>
                    ) : (
                      filteredAttempts.map((attempt, index) => {
                        const attemptScore = Math.round(
                          (attempt.score / attempt.total_questions) * 100
                        )
                        return (
                          <div
                            key={attempt.id}
                            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center">
                              <div className="bg-blue-100 text-blue-800 font-medium rounded-full w-8 h-8 flex items-center justify-center mr-3">
                                {filteredAttempts.length - index}
                              </div>
                              <div>
                                <p className="font-medium">{attempt.topic}</p>
                                <p className="text-sm text-gray-500">
                                  {new Date(attempt.created_at).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="text-right">
                                <p className={`font-bold ${attemptScore >= 70 ? "text-green-600" : "text-red-600"}`}>
                                  {attemptScore}%
                                </p>
                                <p className="text-sm text-gray-500">
                                  {attempt.score}/{attempt.total_questions}
                                </p>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="ml-2"
                                onClick={() => handleTopicSelect(attempt.topic)}
                              >
                                Try Again
                              </Button>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" onClick={() => setTimeFilter("all")}>
                    <Calendar className="mr-2 h-4 w-4" />
                    Show All Time
                  </Button>
                  <Button variant="outline" onClick={goToTopicPage}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Try New Topic
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}