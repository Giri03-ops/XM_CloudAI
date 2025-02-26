# filepath: /C:/XM_Cloud_Certification_LearnerAI/main.py

import json
from generate_xmCloud_Quiz_crew import XMCloudQuizCrew

def run_quiz_generation():
    inputs = {
        "topicList": [
            "XM Cloud Architecture",
            "Sitecore XM Cloud-specific terminology"
        ]
    }

    quiz_crew = XMCloudQuizCrew()

    # Run ONLY the generate quiz
    result = quiz_crew.generate_crew().kickoff(inputs=inputs)
    result_dict = result.to_dict()
    print("Generated Quiz:\n", json.dumps(result_dict, indent=2))

def run_quiz_recheck():
    # Example userAnswers
    inputs = {
        "existingQuiz": {
            "topics": ["XM Cloud Architecture"],
            "questions": [
                {
                    "question": "Sample Q1?",
                    "options": ["A", "B", "C"],
                    "correct_answer": "B"
                }
            ]
        },
        "userAnswers": {"Q1": "A"}  # user got it wrong
    }

    quiz_crew = XMCloudQuizCrew()

    # Run ONLY the re-check
    result = quiz_crew.recheck_crew().kickoff(inputs=inputs)
    result_dict = result.to_dict()
    print("Rechecked Quiz:\n", json.dumps(result_dict, indent=2))

if __name__ == "__main__":
    run_quiz_generation()
    # run_quiz_recheck()
