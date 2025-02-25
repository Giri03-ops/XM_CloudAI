import yaml
from crewai import Agent, Crew, Process, Task,LLM
from crewai.project import CrewBase, agent, crew, task
from crewai_tools import SerperDevTool, ScrapeWebsiteTool
from pydantic import BaseModel, Field
from typing import Dict, List, Optional
from dotenv import load_dotenv
load_dotenv()
import os

llm = LLM(
    model="gemini/gemini-2.0-flash-exp",
    temperature=0.5,
    verbose=True,
    google_api_key = os.getenv("GEMINI_API_KEY"),
)

class TopicDetail(BaseModel):
    explanation: Optional[str] = None
    example: Optional[str] = None
    exam_tips: Optional[str] = None
    common_questions: Optional[List[str]] = None

class ShowPrimaryContentSources(BaseModel):
    topics: List[str] = Field(..., description="List of topics selected")
    content: Dict[str, TopicDetail] = Field(default_factory=dict, description="Detailed content for each topic")
    sources: Dict[str, str] = Field(default_factory=dict, description="Primary sources for the fetched content")
    
@CrewBase
class XMCloudTrainer:
    """A crew of agents to fetch and process content."""

    def __init__(self):
        # Load agents.yaml as a dictionary
        with open("config/agents.yaml", "r") as f:
            self.agents_config = yaml.safe_load(f)

        # Load tasks.yaml as a dictionary
        with open("config/tasks.yaml", "r") as f:
            self.task_config = yaml.safe_load(f)

    @agent
    def get_XMCloud_topics(self) -> Agent:
        """Fetches the primary topics for XMCloud."""
        return Agent(
            config=self.agents_config['get_XMCloud_topics_expert'],  # <-- match your YAML key
            tools=[SerperDevTool(), ScrapeWebsiteTool()],
            verbose=True,
            llm=llm,
            allow_delegation=False,
        )

    @agent
    def show_XMCloud_topicContents(self) -> Agent:
        """Show primary topics for XMCloud."""
        return Agent(
            config=self.agents_config['show_XMCloud_topicContents_expert'],  # <-- match your YAML key
            tools=[],
            verbose=True,
            llm=llm,
            allow_delegation=False,
        )


    @task
    def get_XMCloud_topics_task(self) -> Task:
        """Task to fetch primary topics."""
        return Task(
            config=self.task_config['get_XMCloud_topics_task'],
            agent=self.get_XMCloud_topics(),
        )

    @task
    def show_XMCloud_topicContents_task(self) -> Task:
        """Task to show primary topics."""
        return Task(
            config=self.task_config['show_XMCloud_topicContents_task'],
            agent=self.show_XMCloud_topicContents(),
            output_json=ShowPrimaryContentSources
        )

    @crew
    def crew(self) -> Crew:
        """Crew to fetch and show primary topics."""
        return Crew(
            agents=self.agents,
            tasks=self.tasks,
            process=Process.sequential,
            verbose=True,
        )
