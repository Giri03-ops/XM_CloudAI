from flask import Flask, request, jsonify
from flask_cors import CORS
from flasgger import Swagger, swag_from
import time

# Import your crew modules
from generate_xmCloud_Quiz_crew import XMCloudQuizCrew
from xm_clound_content_crew import XMCloudTrainer

# Import the browser agent trigger function from the separate module
from browser_agent import run_browser_agent

app = Flask(__name__)
swagger = Swagger(app)
CORS(
    app,
    resources={r"/api/*": {"origins": "*"}},
    supports_credentials=True
)

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
    result = quiz_crew.generate_crew().kickoff(inputs=inputs)
    elapsed = time.time() - start_time
    print(f"✅ generate_quiz ran in {elapsed:.2f} seconds")
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
    result = quiz_crew.recheck_crew().kickoff(inputs=inputs)
    elapsed = time.time() - start_time
    print(f"✅ recheck_quiz ran in {elapsed:.2f} seconds")
    return jsonify(result.to_dict()), 200

# New endpoint for browser automation via browser-use
@app.route('/api/browser-run', methods=['POST'])
@swag_from('swagger/browser_agent.yml')
def browser_run():
    """
    Expects a JSON body like:
    {
      "task": "Perform a browser automation task"
    }
    """
    data = request.json
    task = data.get('task', '')
    if not task:
        return jsonify({"error": "No task provided"}), 400

    try:
        start_time = time.time()
        # Call the function in browser_agent.py which runs the agent
        result = run_browser_agent(task)
        elapsed = time.time() - start_time
        print(f"✅ browser_run ran in {elapsed:.2f} seconds")
        return jsonify({"result": result}), 200
    except Exception as e:
        print(f"❌ Error running browser agent: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5000)
