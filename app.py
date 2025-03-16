from flask import Flask, request, jsonify
from flask_cors import CORS
from flasgger import Swagger, swag_from
import time

# Import your crew
from generate_xmCloud_Quiz_crew import XMCloudQuizCrew
from xm_clound_content_crew import XMCloudTrainer

app = Flask(__name__)
swagger = Swagger(app)
CORS(
    app,
    resources={r"/api/*": {"origins": "*"}},
    supports_credentials=True  # Only if you REALLY need to send cookies or tokens
)  # Enable CORS for all routes

@app.route('/api/topics', methods=['POST'])
@swag_from('swagger/process_topics.yml')
def process_topics():
    """
    Expects a JSON body like:
    {
      "topicList": [
        "XM Cloud Architecture and Developer Workflow",
        "Sitecore XM Cloud-specific terminology",
        "Benefits of cloud and SaaS architecture for composable DXP"
      ]
    }
    """
    data = request.json
    topic_list = data.get('topicList', [])

    inputs = {'topicList': topic_list}
    try:
        start_time = time.time()
        result = XMCloudTrainer().crew().kickoff(inputs=inputs)
        
        # Convert CrewOutput -> dict
        result_dict = result.to_dict()
        
        elapsed = time.time() - start_time
        print(f"✅ CrewAI pipeline ran in {elapsed:.2f} seconds.")
        
        return jsonify(result_dict), 200
    except Exception as e:
        print(f"❌ Error processing topics with CrewAI: {str(e)}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/quiz/generate', methods=['POST'])
@swag_from('swagger/generate_quiz.yml')
def generate_quiz():
    data = request.json
    topic_list = data.get('topicList', [])

    inputs = {"topicList": topic_list}
    start_time = time.time()

    quiz_crew = XMCloudQuizCrew()
    # Run only the generate_quiz_task by calling generate_crew().kickoff()
    result = quiz_crew.generate_crew().kickoff(inputs=inputs)

    elapsed = time.time() - start_time
    print(f"✅ generate_quiz ran in {elapsed:.2f} seconds")

    # Convert CrewOutput -> dict, then jsonify
    return jsonify(result.to_dict()), 200

@app.route('/api/quiz/recheck', methods=['POST'])
@swag_from('swagger/recheck_quiz.yml')
def recheck_quiz():
    data = request.json
    inputs = {
      "existingQuiz": data.get("existingQuiz"),
      "userAnswers": data.get("userAnswers"),
    }
    start_time = time.time()

    quiz_crew = XMCloudQuizCrew()
    # Run only the retry_reaccess_task by calling recheck_crew().kickoff()
    result = quiz_crew.recheck_crew().kickoff(inputs=inputs)

    elapsed = time.time() - start_time
    print(f"✅ recheck_quiz ran in {elapsed:.2f} seconds")

    return jsonify(result.to_dict()), 200

if __name__ == "__main__":
    app.run(debug=True, port=5000)


if __name__ == '__main__':
    app.run(debug=True, port=5000)
