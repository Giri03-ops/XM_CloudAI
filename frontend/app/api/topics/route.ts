import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { topicList } = await request.json()

    // Simulate a delay to show loading state
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Create a mock response based on the selected topics
    const response = {
      topics: topicList,
      content: {},
      sources: {},
    }
    

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error processing topics:", error)
    return NextResponse.json({ error: "Failed to process topics" }, { status: 500 })
  }
}

