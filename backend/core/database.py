import os
from pathlib import Path

from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.server_api import ServerApi


BASE_DIR = Path(__file__).resolve().parents[1]

load_dotenv(BASE_DIR / ".env")


MONGODB_URI = os.getenv("MONGODB_URI")

MONGODB_DB_NAME = os.getenv(
    "MONGODB_DB_NAME",
    "travel_recommender",
)


if not MONGODB_URI:
    raise RuntimeError(
        "MONGODB_URI is missing in backend/.env"
    )


mongo_client = MongoClient(
    MONGODB_URI,
    server_api=ServerApi("1"),
    serverSelectionTimeoutMS=10000,
)

mongo_client.admin.command("ping")

database = mongo_client[MONGODB_DB_NAME]

print(
    f"MongoDB Atlas connected successfully: "
    f"{MONGODB_DB_NAME}"
)


def get_database():
    return database