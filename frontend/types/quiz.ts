export interface QuizQuestion {
    question: string
    options: string[]
    correct_answer: string
    topic: string
  }
  
  export interface QuizResponse {
    topics: string[]
    questions: QuizQuestion[]
  }
  
  export interface QuizState {
    currentAnswers: Record<number, string>
    isSubmitted: boolean
    score?: {
      correct: number
      total: number
    }
  }
  
  