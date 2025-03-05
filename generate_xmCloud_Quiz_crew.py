import yaml
from crewai import Agent, Crew, Process, Task, LLM
from crewai.project import CrewBase, agent, crew, task
from pydantic import BaseModel, Field
from typing import List, Optional
import os
from dotenv import load_dotenv

from crewai_tools import SerperDevTool, ScrapeWebsiteTool

load_dotenv()


#LLM CONFIG

llm = LLM(
    model="gemini/gemini-2.0-flash-exp",
    temperature=0.5,
    verbose=True,
    google_api_key=os.getenv("GEMINI_API_KEY"),
)


#Pydantic Models for the expected output of the tasks

class MCQQuestion(BaseModel):
    question: str
    options: List[str]
    correct_answer: str
    topic: str
    hint: Optional[str] = None

class XMCloudQuiz(BaseModel):
    topics: List[str]
    questions: List[MCQQuestion]


#CREW CLASS

@CrewBase
class XMCloudQuizCrew:
    """
    A class with TWO separate 'mini-crews', each returning just ONE task:
      - generate_crew() -> only runs generate_quiz_task
      - recheck_crew()  -> only runs retry_reaccess_task

    So you can do:
      XMCloudQuizCrew().generate_crew().kickoff(inputs=...)
      XMCloudQuizCrew().recheck_crew().kickoff(inputs=...)
    """

    def __init__(self):
        with open("config/agents.yaml", "r") as f:
            self.agents_config = yaml.safe_load(f)

        with open("config/tasks.yaml", "r") as f:
            self.task_config = yaml.safe_load(f)

    # Agents
    @agent
    def generate_quiz_agent(self) -> Agent:
        """Agent that creates a 10-question MCQ quiz."""
        return Agent(
            config=self.agents_config['generate_quiz_agent'],
            tools=[SerperDevTool(), ScrapeWebsiteTool()],
            verbose=True,
            llm=llm,
            allow_delegation=False,
        )

    @agent
    def retry_reaccess_agent(self) -> Agent:
        """Agent that re-checks the quiz answers and adds clarifications."""
        return Agent(
            config=self.agents_config['retry_reaccess_agent'],
            tools=[],
            verbose=True,
            llm=llm,
            allow_delegation=False,
        )

    
    # Tasks
    @task
    def generate_quiz_task(self) -> Task:
        """Generates the quiz by calling generate_quiz_agent."""
        return Task(
            config=self.task_config['generate_quiz_task'],
            agent=self.generate_quiz_agent(),
            output_json=XMCloudQuiz
        )

    @task
    def retry_reaccess_task(self) -> Task:
        """Reassesses the quiz, expects existingQuiz + userAnswers."""
        return Task(
            config=self.task_config['retry_reaccess_task'],
            agent=self.retry_reaccess_agent(),
            output_json=XMCloudQuiz
        )

    # Crew
    @crew
    def generate_crew(self) -> Crew:
        """
        This crew runs ONLY the generate_quiz_task when you do .kickoff().
        """
        return Crew(
            agents=self.agents,
            tasks=[self.generate_quiz_task()],
            process=Process.sequential,
            verbose=True,
        )

    @crew
    def recheck_crew(self) -> Crew:
        """
        This crew runs ONLY the retry_reaccess_task when you do .kickoff().
        """
        return Crew(
            agents=self.agents,
            tasks=[self.retry_reaccess_task()],
            process=Process.sequential,
            verbose=True,
        )
