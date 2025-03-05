import yaml
from crewai import Agent, Crew, Process, Task, LLM
from crewai.project import CrewBase, agent, crew, task
from pydantic import BaseModel, Field
from typing import List, Dict, Optional
from crewai_tools import SerperDevTool, ScrapeWebsiteTool
import os
from dotenv import load_dotenv

load_dotenv()

llm = LLM(
    model="gemini/gemini-2.0-flash-exp",
    temperature=0.5,
    verbose=True,
    google_api_key=os.getenv("GEMINI_API_KEY"),
)

#model
class TopicDetail(BaseModel):
    explanation: Optional[str] = None
    example: Optional[str] = None
    exam_tips: Optional[str] = None
    common_questions: Optional[List[str]] = None
#Model for expected out used by task
class ShowPrimaryContentSources(BaseModel):
    topics: List[str] = Field(..., description="List of topics selected")
    content: Dict[str, TopicDetail] = Field(default_factory=dict, description="Detailed content for each topic")
    sources: Dict[str, str] = Field(default_factory=dict, description="Primary sources for the fetched content")

#CrewBase Class
@CrewBase
class XMCloudTrainer:
    """
    A single-agent approach that does everything in one pass:
    gather + present. We return ShowPrimaryContentSources as final JSON.
    """

    def __init__(self):
        with open("config/agents.yaml", "r") as f:
            self.agents_config = yaml.safe_load(f)
        with open("config/tasks.yaml", "r") as f:
            self.task_config = yaml.safe_load(f)

    @agent
    def get_and_show_XMCloud_content(self) -> Agent:
        """Single agent to gather and present topics in one shot."""
        return Agent(
            config=self.agents_config['get_and_show_XMCloud_content_expert'],
            tools=[SerperDevTool(), ScrapeWebsiteTool()],  # Remove or keep if you need web lookups
            verbose=True,
            llm=llm,
        )

    @task
    def get_and_show_XMCloud_content_task(self) -> Task:
        """One task that calls the single agent, returning final JSON."""
        return Task(
            config=self.task_config['get_and_show_XMCloud_content_task'],
            agent=self.get_and_show_XMCloud_content(),
            output_json=ShowPrimaryContentSources
        )

    @crew
    def crew(self) -> Crew:
        """Runs just one task in sequence, returning final JSON in one pass."""
        return Crew(
            agents=self.agents,
            tasks=[self.get_and_show_XMCloud_content_task()],
            process=Process.sequential,
            verbose=True,
        )
