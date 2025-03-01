import TopicSelector from "@/components/topic-selector"

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800 mb-4">Select Your Topics</h1>
            <p className="text-lg text-gray-600">Choose the topics you want to study and test your knowledge.</p>
          </div>
          <TopicSelector />
        </div>
      </div>
    </main>
  )
}

