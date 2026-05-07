from flask import Flask
from flask_cors import CORS
from api.routes import api_bp

def create_app():
    app = Flask(__name__)
    
    # Frontend (React/HTML) එකෙන් එන requests වලට ඉඩ දෙනවා (CORS)
    CORS(app)

    # API Routes ටික register කරනවා
    app.register_blueprint(api_bp, url_prefix='/api')

    return app

if __name__ == '__main__':
    app = create_app()
    # Port 5000 එකේ app එක run කරනවා
    app.run(debug=True, port=5000)