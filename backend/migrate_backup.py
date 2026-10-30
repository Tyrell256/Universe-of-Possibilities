
import argparse
import hashlib
import json
import sqlite3
from contextlib import closing
from pathlib import Path

from database import DB_PATH


def load_backup(path):
    backup = json.loads(path.read_text(encoding="utf-8"))

    if backup.get("format") != "universe-backup-v1":
        raise ValueError("Unsupported backup format")

    storage = backup["storage"]

    stars = json.loads(storage["universe-stars-v1"])
    links = json.loads(storage["universe-connections-v1"])

    if not isinstance(stars, list) or not isinstance(links, list):
        raise ValueError("Stars and connections must be lists")

    ids = [star["id"] for star in stars]

    if any(type(star_id) is not int for star_id in ids):
        raise ValueError("Star IDs must be integers")

    if len(ids) != len(set(ids)):
        raise ValueError("Duplicate star IDs")

    for star in stars:
        if not star.get("name") or not star.get("category"):
            raise ValueError("A star is missing a name or category")

        position = star.get("position")
        if not isinstance(position, list) or len(position) != 3:
            raise ValueError("Invalid star position")

    seen = set()

    for link in links:
        a, b = link["from"], link["to"]

        if a not in ids or b not in ids or a == b:
            raise ValueError("Invalid connection")

        pair = tuple(sorted((a, b)))

        if pair in seen:
            raise ValueError("Duplicate connection")

        seen.add(pair)

    return stars, links


def migrate(path, apply=False):
    stars, links = load_backup(path)

    # Identify the backup by its actual galaxy data,
    # not by its filename or download timestamp.
    content = json.dumps(
        {"stars": stars, "connections": links},
        sort_keys=True
    )

    source_hash = hashlib.sha256(
        content.encode("utf-8")
    ).hexdigest()

    with closing(sqlite3.connect(DB_PATH)) as db:
        db.execute("PRAGMA foreign_keys = ON")

        existing = db.execute(
            "SELECT COUNT(*) FROM stars"
        ).fetchone()[0]

        print(f"Existing SQLite stars: {existing}")
        print(f"Dreams to import: {len(stars)}")
        print(f"Connections to import: {len(links)}")

        if not apply:
            print("\nPREVIEW ONLY")
            print("All imported dreams will receive new SQLite IDs.")
            print("Connections will be translated using an ID map.")
            print("No changes were made.")
            return

        mapping = {}

        # A transaction keeps the import together.
        # If an insertion fails, SQLite rolls it back.
        with db:
            db.execute("BEGIN IMMEDIATE")

            db.execute("""
                CREATE TABLE IF NOT EXISTS migration_batches (
                    source_hash TEXT PRIMARY KEY
                )
            """)

            db.execute("""
                CREATE TABLE IF NOT EXISTS migration_star_ids (
                    source_hash TEXT NOT NULL,
                    react_id INTEGER NOT NULL,
                    sqlite_id INTEGER NOT NULL,
                    PRIMARY KEY (source_hash, react_id)
                )
            """)

            already_imported = db.execute(
                "SELECT 1 FROM migration_batches "
                "WHERE source_hash = ?",
                (source_hash,)
            ).fetchone()

            if already_imported:
                raise ValueError(
                    "This galaxy backup was already imported"
                )

            db.execute(
                "INSERT INTO migration_batches VALUES (?)",
                (source_hash,)
            )

            for star in stars:
                cursor = db.execute(
                    """
                    INSERT INTO stars (
                        name, category, progress,
                        description, color, size,
                        position_json, difficulty, orbit_json
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        star["name"],
                        star["category"],
                        star.get("progress", 0),
                        star.get("description", ""),
                        star.get("color", "#38bdf8"),
                        star.get("size", 0.4),
                        json.dumps(star["position"]),
                        star.get("difficulty", "Not set"),
                        json.dumps(star["orbit"])
                        if star.get("orbit") is not None
                        else None
                    )
                )

                new_id = cursor.lastrowid
                mapping[star["id"]] = new_id

                db.execute(
                    "INSERT INTO migration_star_ids "
                    "VALUES (?, ?, ?)",
                    (source_hash, star["id"], new_id)
                )

            for link in links:
                a = mapping[link["from"]]
                b = mapping[link["to"]]

                from_id, to_id = sorted((a, b))

                db.execute(
                    """
                    INSERT INTO connections
                    (from_id, to_id, color)
                    VALUES (?, ?, ?)
                    """,
                    (from_id, to_id, link.get("color"))
                )

        print("\nIMPORT COMPLETE")
        print(f"Imported {len(stars)} dreams")
        print(f"Imported {len(links)} connections")
        print("\nReact ID -> SQLite ID")

        for old_id, new_id in mapping.items():
            print(f"{old_id} -> {new_id}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()

    parser.add_argument("backup", type=Path)
    parser.add_argument("--apply", action="store_true")

    args = parser.parse_args()

    migrate(args.backup, args.apply)
