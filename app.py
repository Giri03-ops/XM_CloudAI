from flask import Flask, request, jsonify
from flask_cors import CORS
import time

# Import your crew
from crew import XMCloudTrainer

app = Flask(__name__)
CORS(
    app,
    resources={r"/api/*": {"origins": "*"}},
    supports_credentials=True  # Only if you REALLY need to send cookies or tokens
)  # Enable CORS for all routes

@app.route('/api/topics', methods=['POST'])
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

if __name__ == '__main__':
    app.run(debug=True, port=5000)
