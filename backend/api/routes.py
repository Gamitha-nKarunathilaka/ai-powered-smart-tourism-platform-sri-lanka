import re
from datetime import datetime, timezone

try:
    from bson import ObjectId
except ImportError:
    class ObjectId(str):
        pass

from flask import Blueprint, jsonify, request

try:
    from pymongo import DESCENDING, ReturnDocument
    from pymongo.errors import DuplicateKeyError
except ImportError:
    DESCENDING = -1

    class ReturnDocument:
        AFTER = "after"

    class DuplicateKeyError(Exception):
        pass

from core.collections import (
    articles_collection,
    categories_collection,
    reviews_collection,
)
from core.recommender import recommender_instance


api_bp = Blueprint("api", __name__)


def serialize_value(value):
    """Convert MongoDB values into JSON-safe values."""
    if isinstance(value, ObjectId):
        return str(value)

    if isinstance(value, datetime):
        return value.isoformat()

    if isinstance(value, list):
        return [serialize_value(item) for item in value]

    if isinstance(value, dict):
        return {
            key: serialize_value(item)
            for key, item in value.items()
        }

    return value


def create_slug(title):
    """Create a URL-friendly slug from an article title."""
    slug = title.lower().strip()
    slug = re.sub(r"[^a-z0-9\s-]", "", slug)
    slug = re.sub(r"\s+", "-", slug)
    slug = re.sub(r"-+", "-", slug)

    return slug.strip("-")



@api_bp.route("/recommendations", methods=["POST"])
def recommend():
    data = request.get_json(silent=True)

    if not data:
        return jsonify({
            "error": "Request body must be JSON"
        }), 400

    query = data.get("query")
    top_n = data.get("top_n", 5)
    bert_weight = data.get("bert_weight", 0.7)
    tfidf_weight = data.get("tfidf_weight", 0.3)

    if not query or not query.strip():
        return jsonify({
            "error": "Query cannot be empty"
        }), 400

    try:
        top_n = int(top_n)
        bert_weight = float(bert_weight)
        tfidf_weight = float(tfidf_weight)
    except (TypeError, ValueError):
        return jsonify({
            "error": (
                "top_n, bert_weight and tfidf_weight "
                "must be valid numbers"
            )
        }), 400

    results = recommender_instance.get_recommendations(
        query=query,
        top_n=top_n,
        bert_weight=bert_weight,
        tfidf_weight=tfidf_weight,
    )

    return jsonify({
        "status": "success",
        "results": results,
    })



@api_bp.route("/articles", methods=["GET"])
def get_articles():
    query = {
        "published": True,
    }

    category = request.args.get("category")
    search = request.args.get("search")

    if category and category.lower() != "all":
        query["category"] = category

    if search:
        query["$or"] = [
            {
                "title": {
                    "$regex": search,
                    "$options": "i",
                }
            },
            {
                "subtitle": {
                    "$regex": search,
                    "$options": "i",
                }
            },
            {
                "category": {
                    "$regex": search,
                    "$options": "i",
                }
            },
            {
                "author": {
                    "$regex": search,
                    "$options": "i",
                }
            },
        ]

    articles = articles_collection.find(query).sort(
        "created_at",
        DESCENDING,
    )

    result = [
        serialize_value(article)
        for article in articles
    ]

    return jsonify(result)


@api_bp.route("/articles/<string:slug>", methods=["GET"])
def get_article(slug):
    article = articles_collection.find_one_and_update(
        {
            "slug": slug,
            "published": True,
        },
        {
            "$inc": {
                "views": 1,
            }
        },
        return_document=ReturnDocument.AFTER,
    )

    if article is None:
        return jsonify({
            "error": "Article not found"
        }), 404

    return jsonify(
        serialize_value(article)
    )


@api_bp.route("/articles", methods=["POST"])
def create_article():
    data = request.get_json(silent=True)

    if not data:
        return jsonify({
            "error": "Article data is required"
        }), 400

    required_fields = [
        "title",
        "subtitle",
        "category",
        "author",
        "read_time",
        "hero_image",
        "intro_title",
        "intro",
    ]

    missing_fields = [
        field
        for field in required_fields
        if not data.get(field)
    ]

    if missing_fields:
        return jsonify({
            "error": "Required fields are missing",
            "fields": missing_fields,
        }), 400

    slug = data.get("slug") or create_slug(
        data["title"]
    )

    if not slug:
        return jsonify({
            "error": "Unable to create article slug"
        }), 400

    now = datetime.now(timezone.utc)

    article = {
        "slug": slug,
        "title": data["title"].strip(),
        "subtitle": data["subtitle"].strip(),
        "category": data["category"].strip(),
        "author": data["author"].strip(),
        "published_date": data.get(
            "published_date",
            now.strftime("%B %d, %Y"),
        ),
        "read_time": data["read_time"].strip(),
        "hero_image": data["hero_image"].strip(),
        "tags": data.get("tags", []),
        "intro_title": data["intro_title"].strip(),
        "intro": data["intro"].strip(),
        "paragraphs": data.get("paragraphs", []),
        "sections": data.get("sections", []),
        "published": bool(
            data.get("published", True)
        ),
        "is_featured": bool(
            data.get("is_featured", False)
        ),
        "views": 0,
        "created_at": now,
        "updated_at": None,
    }

    try:
        result = articles_collection.insert_one(
            article
        )
    except DuplicateKeyError:
        return jsonify({
            "error": (
                "An article with this slug "
                "already exists"
            )
        }), 409

    saved_article = articles_collection.find_one({
        "_id": result.inserted_id
    })

    return jsonify(
        serialize_value(saved_article)
    ), 201


@api_bp.route(
    "/articles/<string:slug>",
    methods=["PUT"],
)
def update_article(slug):
    data = request.get_json(silent=True)

    if not data:
        return jsonify({
            "error": "Article data is required"
        }), 400

    allowed_fields = {
        "slug",
        "title",
        "subtitle",
        "category",
        "author",
        "published_date",
        "read_time",
        "hero_image",
        "tags",
        "intro_title",
        "intro",
        "paragraphs",
        "sections",
        "published",
        "is_featured",
    }

    update_data = {
        key: value
        for key, value in data.items()
        if key in allowed_fields
    }

    if not update_data:
        return jsonify({
            "error": "No valid fields to update"
        }), 400

    update_data["updated_at"] = datetime.now(
        timezone.utc
    )

    try:
        updated_article = (
            articles_collection.find_one_and_update(
                {
                    "slug": slug,
                },
                {
                    "$set": update_data,
                },
                return_document=ReturnDocument.AFTER,
            )
        )
    except DuplicateKeyError:
        return jsonify({
            "error": (
                "Another article already uses "
                "the requested slug"
            )
        }), 409

    if updated_article is None:
        return jsonify({
            "error": "Article not found"
        }), 404

    return jsonify(
        serialize_value(updated_article)
    )


@api_bp.route(
    "/articles/<string:slug>",
    methods=["DELETE"],
)
def delete_article(slug):
    result = articles_collection.delete_one({
        "slug": slug
    })

    if result.deleted_count == 0:
        return jsonify({
            "error": "Article not found"
        }), 404

    return jsonify({
        "message": "Article deleted successfully"
    })


#

@api_bp.route("/categories", methods=["GET"])
def get_categories():
    categories = categories_collection.find().sort(
        "name",
        1,
    )

    return jsonify([
        serialize_value(category)
        for category in categories
    ])
@api_bp.route("/reviews", methods=["GET"])
def get_reviews():
    """Fetch all reviews, sorted by newest first."""
    reviews = reviews_collection.find().sort(
        "created_at",
        DESCENDING,
    )

    result = [
        serialize_value(review)
        for review in reviews
    ]

    return jsonify(result)


@api_bp.route("/reviews", methods=["POST"])
def create_review():
    """Create a new review (testimonial)."""
    data = request.get_json(silent=True)

    if not data:
        return jsonify({
            "error": "Review data is required"
        }), 400

    required_fields = [
        "name",
        "country",
        "rating",
        "text",
    ]

    missing_fields = [
        field
        for field in required_fields
        if not data.get(field)
    ]

    if missing_fields:
        return jsonify({
            "error": "Required fields are missing",
            "fields": missing_fields,
        }), 400

    now = datetime.now(timezone.utc)

    # Avatar image එක Frontend එකෙන් එව්වේ නැත්නම් හිස්ව තබන්න
    avatar_url = data.get("img") or f"https://ui-avatars.com/api/?name={data['name'].replace(' ', '+')}&background=06b6d4&color=fff"

    review = {
        "name": data["name"].strip(),
        "country": data["country"].strip(),
        "rating": int(data["rating"]),
        "text": data["text"].strip(),
        "img": avatar_url,
        "created_at": now,
    }

    try:
        result = reviews_collection.insert_one(review)
    except Exception as e:
         return jsonify({
            "error": f"Failed to save review: {str(e)}"
        }), 500

    saved_review = reviews_collection.find_one({
        "_id": result.inserted_id
    })

    return jsonify(
        serialize_value(saved_review)
    ), 201