import json
from crew import XMCloudTrainer

def run_crew():
    inputs = {
        'topicList': [
            'XM Cloud Architecture and Developer Workflow,'
            ' Sitecore XM Cloud-specific terminology,'
            ' Benefits of cloud and SaaS architecture for composable DXP'
        ]
    }

    result = XMCloudTrainer().crew().kickoff(inputs=inputs)


    # Option B: Convert to pretty JSON if you want a JSON string
    result_json = json.dumps(result, indent=2)
    print("JSON result:\n", result_json)

if __name__ == '__main__':
    final_output = run_crew()
    # final_output is now the structured dictionary from CrewAI
