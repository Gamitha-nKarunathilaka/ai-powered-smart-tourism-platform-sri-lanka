import re
from datetime import datetime, timezone

from bson import ObjectId
from flask import Blueprint, jsonify, request
from pymongo import DESCENDING
from pymongo.errors import DuplicateKeyError

from core.collections import articles_collection, categories_collection

article_bp = Blueprint("articles", __name__)


def slugify(value):
    value = str(value or "").strip().lower()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-")


def serialize(value):
    if isinstance(value, ObjectId):
        return str(value)
    if isinstance(value, datetime):
        return value.isoformat()
    if isinstance(value, list):
        return [serialize(item) for item in value]
    if isinstance(value, dict):
        return {key: serialize(item) for key, item in value.items()}
    return value


def normalize_payload(data, existing=None):
    existing = existing or {}
    now = datetime.now(timezone.utc)

    title = str(data.get("title", existing.get("title", ""))).strip()
    slug = slugify(data.get("slug") or existing.get("slug") or title)

    tags = data.get("tags", existing.get("tags", []))
    if isinstance(tags, str):
        tags = [tag.strip() for tag in tags.split(",") if tag.strip()]

    paragraphs = data.get("paragraphs", existing.get("paragraphs", []))
    paragraphs = [str(p).strip() for p in paragraphs if str(p).strip()]

    sections = []
    for section in data.get("sections", existing.get("sections", [])):
        if not isinstance(section, dict):
            continue
        heading = str(section.get("heading", "")).strip()
        text = str(section.get("text", "")).strip()
        if heading and text:
            sections.append({
                "label": str(section.get("label", "")).strip() or None,
                "heading": heading,
                "text": text,
                "image": str(section.get("image", "")).strip() or None,
            })

    return {
        "slug": slug,
        "title": title,
        "subtitle": str(data.get("subtitle", existing.get("subtitle", ""))).strip(),
        "category": str(data.get("category", existing.get("category", ""))).strip(),
        "author": str(data.get("author", existing.get("author", ""))).strip(),
        "published_date": data.get(
            "published_date",
            existing.get("published_date", now.isoformat()),
        ) or now.isoformat(),
        "read_time": str(data.get("read_time", existing.get("read_time", ""))).strip(),
        "hero_image": str(data.get("hero_image", existing.get("hero_image", ""))).strip(),
        "tags": tags,
        "intro_title": str(data.get("intro_title", existing.get("intro_title", ""))).strip(),
        "intro": str(data.get("intro", existing.get("intro", ""))).strip(),
        "paragraphs": paragraphs,
        "sections": sections,
        "published": bool(data.get("published", existing.get("published", True))),
        "is_featured": bool(
            data.get("is_featured", existing.get("is_featured", False))
        ),
        "views": int(data.get("views", existing.get("views", 0)) or 0),
        "created_at": existing.get("created_at", now),
        "updated_at": now,
    }


def validate_article(article):
    required = [
        "slug", "title", "subtitle", "category", "author",
        "read_time", "hero_image", "intro_title", "intro",
    ]
    missing = [field for field in required if not article.get(field)]
    if missing:
        return "Missing required fields: " + ", ".join(missing)
    if not article["sections"]:
        return "At least one section with heading and text is required."
    return None


@article_bp.get("/articles")
def list_articles():
    published_only = request.args.get("published") == "true"
    query = {"published": True} if published_only else {}

    articles = articles_collection.find(query).sort("created_at", DESCENDING)
    return jsonify([serialize(article) for article in articles])


@article_bp.get("/articles/<string:slug>")
def get_article(slug):
    article = articles_collection.find_one({"slug": slug})
    if article is None:
        return jsonify({"error": "Article not found"}), 404

    if request.args.get("increment_views", "true") == "true":
        articles_collection.update_one(
            {"_id": article["_id"]},
            {"$inc": {"views": 1}},
        )
        article["views"] = article.get("views", 0) + 1

    return jsonify(serialize(article))


@article_bp.post("/articles")
def create_article():
    data = request.get_json(silent=True) or {}
    article = normalize_payload(data)

    validation_error = validate_article(article)
    if validation_error:
        return jsonify({"error": validation_error}), 400

    try:
        result = articles_collection.insert_one(article)
    except DuplicateKeyError:
        return jsonify({"error": "This article slug already exists."}), 409

    created = articles_collection.find_one({"_id": result.inserted_id})
    return jsonify(serialize(created)), 201


@article_bp.put("/articles/<string:slug>")
def update_article(slug):
    existing = articles_collection.find_one({"slug": slug})
    if existing is None:
        return jsonify({"error": "Article not found"}), 404

    data = request.get_json(silent=True) or {}
    article = normalize_payload(data, existing)

    validation_error = validate_article(article)
    if validation_error:
        return jsonify({"error": validation_error}), 400

    try:
        articles_collection.update_one(
            {"_id": existing["_id"]},
            {"$set": article},
        )
    except DuplicateKeyError:
        return jsonify({"error": "Another article already uses this slug."}), 409

    updated = articles_collection.find_one({"_id": existing["_id"]})
    return jsonify(serialize(updated))


@article_bp.delete("/articles/<string:slug>")
def delete_article(slug):
    result = articles_collection.delete_one({"slug": slug})
    if result.deleted_count == 0:
        return jsonify({"error": "Article not found"}), 404

    return jsonify({
        "message": "Article deleted successfully.",
        "slug": slug,
    })


@article_bp.get("/categories")
def list_categories():
    categories = categories_collection.find().sort("name", 1)
    return jsonify([serialize(category) for category in categories])
