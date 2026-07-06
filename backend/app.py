from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from api.article_routes import article_bp
from core.database import get_database
from api.routes import api_bp


load_dotenv()

app = Flask(__name__)


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


app.register_blueprint(
    api_bp,
    url_prefix="/api",
)

app.register_blueprint(
    article_bp,
    url_prefix="/api",
)

@app.get("/api/db-test")
def db_test():
    database = get_database()

    result = database.command("ping")

    return jsonify({
        "message": "MongoDB Atlas connected",
        "database": database.name,
        "result": result,
    })


if __name__ == "__main__":
    app.run(
        debug=True,
        host="127.0.0.1",
        port=8000,
    )