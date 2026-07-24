from flask import Flask, request, jsonify
import traceback
import sys
from flask_cors import CORS
from dotenv import load_dotenv

from api.routes import api_bp
from api.article_routes import article_bp
from core.database import get_database

from agent import TravelAgent

load_dotenv()

app = Flask(__name__)

# -----------------------------------------
# Enable CORS
# -----------------------------------------
CORS(
    app,
    resources={
        r"/api/*": {
            "origins": [
                "http://localhost:5173",
                "http://127.0.0.1:5173",
            ]
        }
    },
)

# -----------------------------------------
# Register Blueprints
# -----------------------------------------
app.register_blueprint(
    api_bp,
    url_prefix="/api"
)

app.register_blueprint(
    article_bp,
    url_prefix="/api"
)

# -----------------------------------------
# AI Travel Agent
# -----------------------------------------
agent = TravelAgent()

# -----------------------------------------
# Health Check
# -----------------------------------------
@app.get("/api/health")
def health():
    return jsonify({
        "status": "ok",
        "message": "Travel AI Backend is running successfully.",
        "services": {
            "mongodb": True,
            "travel_agent": True,
            "mcp": True
        }
    })


# -----------------------------------------
# MongoDB Test
# -----------------------------------------
@app.get("/api/db-test")
def db_test():

    database = get_database()

    result = database.command("ping")

    return jsonify({
        "message": "MongoDB Atlas connected",
        "database": database.name,
        "result": result
    })


# -----------------------------------------
# AI Agent Endpoint
# -----------------------------------------
@app.post("/api/agent-plan")
def agent_plan():
   

    data = request.get_json(force=True)

    try:

        result = agent.create_plan(

            query=data.get("query"),

            start_location=data.get(
                "start_location",
                "Colombo"
            ),

            end_location=data.get(
                "end_location",
                "Colombo"
            ),

            travel_date=data.get(
                "travel_date"
            ),

            days=int(
                data.get("days", 3)
            ),

            top_n=int(
                data.get("top_n", 15)
            ),

            travelers=int(
                data.get("travelers", 2)
            ),

            transport_type=data.get(
                "transport_type",
                "car"
            ),

            daily_max_travel_hours=float(
                data.get(
                    "daily_max_travel_hours",
                    6
                )
            ),

            include_weather=bool(
                data.get(
                    "include_weather",
                    True
                )
            ),

            travel_style=data.get(
                "travel_style",
                "Solo"
            ),

            include_accommodation=bool(
                data.get(
                    "include_accommodation",
                    True
                )
            )

        )

        return jsonify(result)

    except Exception as e:

        # Print full traceback to server console for debugging
        tb = traceback.format_exc()
        print(tb, file=sys.stderr)

        return jsonify({
            "success": False,
            "error": str(e),
            "traceback": tb
        }), 500


# -----------------------------------------
# Run Flask
# -----------------------------------------
if __name__ == "__main__":

    app.run(
        debug=True,
        host="127.0.0.1",
        port=8000
    )