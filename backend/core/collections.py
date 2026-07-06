from pymongo import ASCENDING, DESCENDING

from core.database import get_database


database = get_database()


articles_collection = database["articles"]
categories_collection = database["categories"]
trips_collection = database["trips"]


def initialize_collections():
    articles_collection.create_index(
        [("slug", ASCENDING)],
        unique=True,
        name="unique_article_slug",
    )

    articles_collection.create_index(
        [
            ("published", ASCENDING),
            ("created_at", DESCENDING),
        ],
        name="published_articles_index",
    )

    articles_collection.create_index(
        [("category", ASCENDING)],
        name="article_category_index",
    )

    articles_collection.create_index(
        [("is_featured", ASCENDING)],
        name="featured_article_index",
    )

    articles_collection.create_index(
        [("views", DESCENDING)],
        name="article_views_index",
    )

    categories_collection.create_index(
        [("slug", ASCENDING)],
        unique=True,
        name="unique_category_slug",
    )

    trips_collection.create_index(
        [("created_at", DESCENDING)],
        name="trip_created_at_index",
    )

    print(
        "MongoDB collections initialized successfully."
    )