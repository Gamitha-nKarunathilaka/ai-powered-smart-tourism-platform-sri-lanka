from datetime import datetime, timezone
from pathlib import Path
import sys

from pymongo import ASCENDING, DESCENDING
from pymongo.errors import CollectionInvalid

# Allow imports from backend/
BASE_DIR = Path(__file__).resolve().parents[1]
sys.path.append(str(BASE_DIR))

from core.database import get_database


def create_collection_if_missing(db, name, validator):
    existing_collections = db.list_collection_names()

    if name in existing_collections:
        print(f"Collection already exists: {name}")
        return db[name]

    try:
        db.create_collection(
            name,
            validator=validator,
            validationLevel="moderate",
            validationAction="error",
        )
        print(f"Created collection: {name}")
    except CollectionInvalid:
        print(f"Collection already exists: {name}")

    return db[name]


def setup_categories_collection(db):
    validator = {
        "$jsonSchema": {
            "bsonType": "object",
            "required": [
                "name",
                "slug",
                "created_at",
            ],
            "properties": {
                "name": {
                    "bsonType": "string",
                    "description": "Category display name",
                },
                "slug": {
                    "bsonType": "string",
                    "description": "Unique URL-friendly category name",
                },
                "description": {
                    "bsonType": ["string", "null"],
                },
                "created_at": {
                    "bsonType": "date",
                },
                "updated_at": {
                    "bsonType": ["date", "null"],
                },
            },
        }
    }

    categories = create_collection_if_missing(
        db,
        "categories",
        validator,
    )

    categories.create_index(
        [("slug", ASCENDING)],
        unique=True,
        name="unique_category_slug",
    )

    categories.create_index(
        [("name", ASCENDING)],
        name="category_name_index",
    )

    return categories


def setup_articles_collection(db):
    validator = {
        "$jsonSchema": {
            "bsonType": "object",
            "required": [
                "slug",
                "title",
                "category",
                "subtitle",
                "author",
                "published_date",
                "read_time",
                "hero_image",
                "intro_title",
                "intro",
                "paragraphs",
                "sections",
                "published",
                "created_at",
            ],
            "properties": {
                "slug": {
                    "bsonType": "string",
                    "description": "Unique URL-friendly article name",
                },
                "title": {
                    "bsonType": "string",
                },
                "subtitle": {
                    "bsonType": "string",
                },
                "category": {
                    "bsonType": "string",
                },
                "author": {
                    "bsonType": "string",
                },
                "published_date": {
                    "bsonType": ["date", "string"],
                },
                "read_time": {
                    "bsonType": "string",
                },
                "hero_image": {
                    "bsonType": "string",
                },
                "tags": {
                    "bsonType": "array",
                    "items": {
                        "bsonType": "string",
                    },
                },
                "intro_title": {
                    "bsonType": "string",
                },
                "intro": {
                    "bsonType": "string",
                },
                "paragraphs": {
                    "bsonType": "array",
                    "items": {
                        "bsonType": "string",
                    },
                },
                "sections": {
                    "bsonType": "array",
                    "items": {
                        "bsonType": "object",
                        "required": [
                            "heading",
                            "text",
                        ],
                        "properties": {
                            "label": {
                                "bsonType": ["string", "null"],
                            },
                            "heading": {
                                "bsonType": "string",
                            },
                            "text": {
                                "bsonType": "string",
                            },
                            "image": {
                                "bsonType": ["string", "null"],
                            },
                        },
                    },
                },
                "published": {
                    "bsonType": "bool",
                },
                "is_featured": {
                    "bsonType": "bool",
                },
                "views": {
                    "bsonType": ["int", "long", "double"],
                },
                "created_at": {
                    "bsonType": "date",
                },
                "updated_at": {
                    "bsonType": ["date", "null"],
                },
            },
        }
    }

    articles = create_collection_if_missing(
        db,
        "articles",
        validator,
    )

    articles.create_index(
        [("slug", ASCENDING)],
        unique=True,
        name="unique_article_slug",
    )

    articles.create_index(
        [("published", ASCENDING), ("created_at", DESCENDING)],
        name="published_articles_index",
    )

    articles.create_index(
        [("category", ASCENDING)],
        name="article_category_index",
    )

    articles.create_index(
        [("is_featured", ASCENDING)],
        name="featured_article_index",
    )

    articles.create_index(
        [("views", DESCENDING)],
        name="article_views_index",
    )

    return articles


def seed_categories(categories):
    category_names = [
        "Beaches",
        "Nature",
        "Wildlife",
        "Culture",
        "Food",
        "Travel Tips",
    ]

    now = datetime.now(timezone.utc)

    for name in category_names:
        slug = (
            name.lower()
            .replace("&", "and")
            .replace(" ", "-")
        )

        categories.update_one(
            {"slug": slug},
            {
                "$setOnInsert": {
                    "name": name,
                    "slug": slug,
                    "description": "",
                    "created_at": now,
                    "updated_at": None,
                }
            },
            upsert=True,
        )

    print("Default categories inserted.")


def seed_sample_article(articles):
    now = datetime.now(timezone.utc)

    sample_article = {
        "slug": "best-beaches-sri-lanka",
        "title": "10 Best Beaches in Sri Lanka",
        "subtitle": (
            "Discover golden southern shores, hidden east-coast bays, "
            "and unforgettable tropical beach experiences."
        ),
        "category": "Beaches",
        "author": "Emma Johnson",
        "published_date": now,
        "read_time": "7 min read",
        "hero_image": (
            "https://images.unsplash.com/photo-1507525428034-"
            "b723cf961d3e?auto=format&fit=crop&w=1800&q=90"
        ),
        "tags": [
            "Beaches",
            "Families",
            "Solo Travel",
            "Romantic",
        ],
        "intro_title": "Sri Lanka’s Best Beaches",
        "intro": (
            "Sri Lanka is surrounded by a beautiful tropical coastline, "
            "with beaches for surfing, swimming, wildlife watching, "
            "and peaceful relaxation."
        ),
        "paragraphs": [
            (
                "The south coast is known for golden beaches, boutique hotels, "
                "surf schools, beach cafés, and dramatic sunsets."
            ),
            (
                "The east coast offers calmer water, wide sandy beaches, "
                "and a quieter atmosphere during its main travel season."
            ),
        ],
        "sections": [
            {
                "label": "South Coast Guide",
                "heading": "Mirissa",
                "text": (
                    "Mirissa is known for its crescent-shaped beach, cafés, "
                    "sunsets, and whale-watching tours."
                ),
                "image": (
                    "https://images.unsplash.com/photo-1588258524675-"
                    "c619a4f8ef2d?auto=format&fit=crop&w=1500&q=90"
                ),
            },
            {
                "label": "South Coast Guide",
                "heading": "Unawatuna",
                "text": (
                    "Unawatuna offers a lively beach, calm water, restaurants, "
                    "and easy access to Galle Fort."
                ),
                "image": None,
            },
        ],
        "published": True,
        "is_featured": True,
        "views": 0,
        "created_at": now,
        "updated_at": None,
    }

    articles.update_one(
        {"slug": sample_article["slug"]},
        {"$setOnInsert": sample_article},
        upsert=True,
    )

    print("Sample article inserted.")


def main():
    db = get_database()

    print(f"Using database: {db.name}")

    categories = setup_categories_collection(db)
    articles = setup_articles_collection(db)

    seed_categories(categories)
    seed_sample_article(articles)

    print("Blog database setup completed successfully.")


if __name__ == "__main__":
    main()
