import asyncio
import os
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from browser_use import Agent
from pydantic import SecretStr

# Load environment variables from your .env file
load_dotenv()

# Retrieve your Gemini API key from the environment
api_key = os.getenv("GEMINI_API_KEY")

# Initialize the Gemini-based model using ChatGoogleGenerativeAI
llm = ChatGoogleGenerativeAI(
    model='gemini-2.0-flash-exp',
    api_key=SecretStr(api_key)
)

def run_browser_agent(task: str) -> str:
    """
    Triggers the browser-use Agent with the provided task string.
    Runs the agent asynchronously and returns the result.
    """
    async def _run():
        agent = Agent(
            task=task,
            llm=llm
        )
        result = await agent.run()
        return result

    # Use asyncio.run to execute the asynchronous function
    return asyncio.run(_run())
