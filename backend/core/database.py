import os
from pathlib import Path

try:
    from dotenv import load_dotenv
except ImportError:  # pragma: no cover - environment fallback
    def load_dotenv(*args, **kwargs):
        return False

try:
    from pymongo import MongoClient
    from pymongo.server_api import ServerApi
except ImportError:  # pragma: no cover - environment fallback
    MongoClient = None
    ServerApi = None


BASE_DIR = Path(__file__).resolve().parents[1]

load_dotenv(BASE_DIR / ".env")


MONGODB_URI = os.getenv("MONGODB_URI")

MONGODB_DB_NAME = os.getenv(
    "MONGODB_DB_NAME",
    "travel_recommender",
)


class _FallbackCursor:
    def __init__(self, items):
        self._items = list(items)

    def sort(self, *args, **kwargs):
        return self

    def __iter__(self):
        return iter(self._items)

    def __len__(self):
        return len(self._items)


class _FallbackCollection:
    def __init__(self, name):
        self.name = name
        self._documents = []

    def create_index(self, *args, **kwargs):
        return None

    def find(self, query=None):
        return _FallbackCursor(self._documents)

    def find_one(self, query=None):
        return self._documents[0] if self._documents else None

    def find_one_and_update(self, filter=None, update=None, **kwargs):
        return None

    def insert_one(self, document):
        self._documents.append(document)
        return type("InsertResult", (), {"inserted_id": len(self._documents)})()

    def update_one(self, filter=None, update=None):
        return type("UpdateResult", (), {"modified_count": 0, "matched_count": 0})()

    def delete_one(self, filter=None):
        return type("DeleteResult", (), {"deleted_count": 0})()


class _FallbackDatabase:
    def __init__(self, name):
        self.name = name
        self._collections = {}

    def __getitem__(self, name):
        if name not in self._collections:
            self._collections[name] = _FallbackCollection(name)
        return self._collections[name]

    def command(self, command):
        return {"ok": 1, "command": command}


if not MONGODB_URI or MongoClient is None or ServerApi is None:
    database = _FallbackDatabase(MONGODB_DB_NAME)
    print(f"MongoDB unavailable; using in-memory fallback database for {MONGODB_DB_NAME}.")
else:
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