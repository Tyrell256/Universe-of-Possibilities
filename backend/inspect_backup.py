
import json
import sqlite3
import sys
from pathlib import Path

from database import DB_PATH


def inspect_backup(file_path):
    # Read our exported React universe
    with open(file_path, "r", encoding="utf-8") as file:
        backup = json.load(file)

    if backup.get("format") != "universe-backup-v1":
        raise ValueError("Unrecognized backup format")

    storage = backup["storage"]

    # Our backup stores JSON inside JSON strings
    def read_saved_data(key):
        saved = storage.get(key)

        if saved is None:
            raise ValueError(f"Missing backup data: {key}")

        data = json.loads(saved)

        if not isinstance(data, list):
            raise ValueError(f"Expected a list for {key}")

        return data

    stars = read_saved_data("universe-stars-v1")

    connections = read_saved_data(
        "universe-connections-v1"
    )

    print("\nUNIVERSE BACKUP INSPECTION")
    print("----------------------------")
    print(f"Stars found: {len(stars)}")
    print(f"Connections found: {len(connections)}")

    # Verify our star IDs
    star_ids = [star["id"] for star in stars]

    if any(type(id) is not int for id in star_ids):
        raise ValueError("Star IDs must be integers")

    if len(star_ids) != len(set(star_ids)):
        raise ValueError("Duplicate star IDs in backup")

    # Check our existing SQLite records
    with sqlite3.connect(DB_PATH) as connection:
        existing_ids = {
            row[0]
            for row in connection.execute(
                "SELECT id FROM stars"
            )
        }

    conflicts = set(star_ids) & existing_ids

    print(f"Existing SQLite stars: {len(existing_ids)}")
    print(f"Overlapping IDs: {len(conflicts)}")

    if conflicts:
        print(f"IDs needing mapping: {sorted(conflicts)}")

    # Verify that each connection has valid endpoints
    missing_links = [
        link
        for link in connections
        if link.get("from") not in star_ids
        or link.get("to") not in star_ids
    ]

    print(f"Invalid connections: {len(missing_links)}")

    print("\nBACKED-UP DREAMS")

    for star in stars:
        print(f"  {star['id']}: {star['name']}")

    if missing_links:
        print("\nWARNING: Some connections reference missing stars.")

    print("\nInspection complete. No database changes made.")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python inspect_backup.py <backup-file>")
        sys.exit(1)

    inspect_backup(Path(sys.argv[1]))
