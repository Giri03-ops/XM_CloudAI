// Define types for the API responses and requests

export interface TopicRequest {
    topicList: string[]
  }
  
  export interface TopicContent {
    explanation: string
    example: string
    exam_tips: string
    common_questions: string[]
  }
  
  export interface TopicResponse {
    topics: string[]
    content: Record<string, TopicContent>
    sources: Record<string, string>
  }
  
  