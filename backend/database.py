import json
import sqlite3
from pathlib import Path

# Where our database will be stored
DB_PATH = Path(__file__).parent / "universe.db"



def initialize_database():
    with sqlite3.connect(DB_PATH) as connection:

        # Keep our existing database table
        connection.execute("""
            CREATE TABLE IF NOT EXISTS stars (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                category TEXT NOT NULL,
                progress INTEGER NOT NULL DEFAULT 0
            )
        """)

        # Find the columns already in our database
        existing_columns = {
            row[1]
            for row in connection.execute(
                "PRAGMA table_info(stars)"
            )
        }

        # New information our 3D stars need
        new_columns = {
            "description": "TEXT NOT NULL DEFAULT ''",
            "color": "TEXT NOT NULL DEFAULT '#38bdf8'",
            "size": "REAL NOT NULL DEFAULT 0.4",
            "position_json": "TEXT NOT NULL DEFAULT '[0,0,0]'",
            "difficulty": "TEXT NOT NULL DEFAULT 'Not set'",
            "orbit_json": "TEXT"
        }

        # Add only the missing columns
        for column, definition in new_columns.items():
            if column not in existing_columns:
                connection.execute(
                    f"ALTER TABLE stars ADD COLUMN "
                    f"{column} {definition}"
                )

                print(f"Added column: {column}")

        connection.commit()

    print("Universe database initialized!")

    # Connect to SQLite
    with sqlite3.connect(DB_PATH) as connection:

        # Create our stars table
        connection.execute("""
            CREATE TABLE IF NOT EXISTS stars (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                category TEXT NOT NULL,
                progress INTEGER NOT NULL DEFAULT 0
            )
        """)


        # Create our constellation connections table
        connection.execute("""
            CREATE TABLE IF NOT EXISTS connections (
                from_id INTEGER NOT NULL,
                to_id INTEGER NOT NULL,
                color TEXT,

                PRIMARY KEY (from_id, to_id),

                CHECK (from_id < to_id),

                FOREIGN KEY (from_id)
                    REFERENCES stars(id)
                    ON DELETE CASCADE,

                FOREIGN KEY (to_id)
                    REFERENCES stars(id)
                    ON DELETE CASCADE
            )
        """)

        connection.commit()

    print("Universe database initialized!")




def get_all_stars():
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row

    try:
        cursor = connection.execute("""
            SELECT
                id,
                name,
                category,
                progress,
                description,
                color,
                size,
                position_json,
                difficulty,
                orbit_json
            FROM stars
            ORDER BY id
        """)

        rows = cursor.fetchall()
        stars = []

        for row in rows:
            star = dict(row)

            # Convert the saved position into a list
            star["position"] = json.loads(
                star.pop("position_json")
            )

            # Convert orbit data into a dictionary
            orbit_json = star.pop("orbit_json")

            star["orbit"] = (
                json.loads(orbit_json)
                if orbit_json
                else None
            )

            stars.append(star)

        return stars

    finally:
        connection.close()

    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row

    try:
        cursor = connection.execute(
            "SELECT id, name, category, progress "
            "FROM stars ORDER BY id"
        )

        rows = cursor.fetchall()

        return [dict(row) for row in rows]

    finally:
        connection.close()



def insert_star(
    name,
    category,
    progress=0,
    description="",
    color="#38bdf8",
    size=0.4,
    position=None,
    difficulty="Not set",
    orbit=None
):
    if position is None:
        position = [0.0, 0.0, 0.0]

    connection = sqlite3.connect(DB_PATH)

    try:
        cursor = connection.execute(
            """
            INSERT INTO stars (
                name,
                category,
                progress,
                description,
                color,
                size,
                position_json,
                difficulty,
                orbit_json
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                name,
                category,
                progress,
                description,
                color,
                size,
                json.dumps(position),
                difficulty,
                json.dumps(orbit) if orbit is not None else None
            )
        )

        connection.commit()

        return {
            "id": cursor.lastrowid,
            "name": name,
            "category": category,
            "progress": progress,
            "description": description,
            "color": color,
            "size": size,
            "position": position,
            "difficulty": difficulty,
            "orbit": orbit
        }

    finally:
        connection.close()

    connection = sqlite3.connect(DB_PATH)

    try:
        cursor = connection.execute(
            """
            INSERT INTO stars (name, category, progress)
            VALUES (?, ?, ?)
            """,
            (name, category, progress)
        )

        connection.commit()

        return {
            "id": cursor.lastrowid,
            "name": name,
            "category": category,
            "progress": progress
        }

    finally:
        connection.close()




def update_star(
    star_id,
    name,
    category,
    progress,
    description,
    color,
    size,
    position,
    difficulty,
    orbit
):
    connection = sqlite3.connect(DB_PATH)

    try:
        # This transaction saves the update and snapshot together.
        with connection:
            cursor = connection.execute(
                """
                UPDATE stars
                SET
                    name = ?,
                    category = ?,
                    progress = ?,
                    description = ?,
                    color = ?,
                    size = ?,
                    position_json = ?,
                    difficulty = ?,
                    orbit_json = ?
                WHERE id = ?
                """,
                (
                    name,
                    category,
                    progress,
                    description,
                    color,
                    size,
                    json.dumps(position),
                    difficulty,
                    json.dumps(orbit)
                    if orbit is not None else None,
                    star_id
                )
            )

            # Stop if the requested star doesn't exist
            if cursor.rowcount == 0:
                return None

            # Check whether the star belongs to our galaxy
            is_galaxy_star = connection.execute(
                """
                SELECT 1
                FROM migration_star_ids
                WHERE sqlite_id = ?
                  AND source_hash = (
                      SELECT source_hash
                      FROM migration_batches
                      ORDER BY rowid DESC
                      LIMIT 1
                  )
                """,
                (star_id,)
            ).fetchone()

            print(
                f"HISTORY DEBUG: Star {star_id}, "
                f"belongs to galaxy: {bool(is_galaxy_star)}"
            )

            # Record a snapshot before the transaction commits
            if is_galaxy_star:
                record_galaxy_snapshot(
                    connection,
                    f"star-updated:{star_id}"
                )

        # The transaction commits automatically here.
        return {
            "id": star_id,
            "name": name,
            "category": category,
            "progress": progress,
            "description": description,
            "color": color,
            "size": size,
            "position": position,
            "difficulty": difficulty,
            "orbit": orbit
        }

    finally:
        connection.close()

def delete_star(star_id):
    connection = sqlite3.connect(DB_PATH)

    try:
        cursor = connection.execute(
            """
            DELETE FROM stars
            WHERE id = ?
            """,
            (star_id,)
        )

        connection.commit()

        return cursor.rowcount > 0

    finally:
        connection.close()


def get_all_connections():
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row

    try:
        cursor = connection.execute("""
            SELECT
                from_id,
                to_id,
                color
            FROM connections
            ORDER BY from_id, to_id
        """)

        rows = cursor.fetchall()

        return [
            {
                "from": row["from_id"],
                "to": row["to_id"],
                "color": row["color"]
            }
            for row in rows
        ]

    finally:
        connection.close()


def get_imported_galaxy():
    # Find the most recently imported backup
    with sqlite3.connect(DB_PATH) as connection:
        batch = connection.execute(
            """
            SELECT source_hash
            FROM migration_batches
            ORDER BY rowid DESC
            LIMIT 1
            """
        ).fetchone()

        if batch is None:
            return None

        source_hash = batch[0]

        # Retrieve the SQLite IDs assigned during import
        rows = connection.execute(
            """
            SELECT sqlite_id
            FROM migration_star_ids
            WHERE source_hash = ?
            """,
            (source_hash,)
        ).fetchall()

    imported_ids = {
        row[0] for row in rows
    }

    # Only include stars belonging to this import
    stars = [
        star
        for star in get_all_stars()
        if star["id"] in imported_ids
    ]

    # Only include connections between imported stars
    connections = [
        link
        for link in get_all_connections()
        if link["from"] in imported_ids
        and link["to"] in imported_ids
    ]

    return {
        "stars": stars,
        "connections": connections
    }



def create_galaxy_star(star):
    connection = sqlite3.connect(DB_PATH)

    try:
        connection.execute("BEGIN IMMEDIATE")

        # Find our current galaxy
        batch = connection.execute(
            """
            SELECT source_hash
            FROM migration_batches
            ORDER BY rowid DESC
            LIMIT 1
            """
        ).fetchone()

        if batch is None:
            raise ValueError("No imported galaxy found")

        source_hash = batch[0]

        # Insert the new star
        cursor = connection.execute(
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
                star["progress"],
                star["description"],
                star["color"],
                star["size"],
                json.dumps(star["position"]),
                star["difficulty"],
                json.dumps(star["orbit"])
                if star["orbit"] is not None
                else None
            )
        )

        new_id = cursor.lastrowid

        # Generate a unique React mapping ID
        next_react_id = connection.execute(
            """
            SELECT COALESCE(MAX(react_id), 0) + 1
            FROM migration_star_ids
            WHERE source_hash = ?
            """,
            (source_hash,)
        ).fetchone()[0]

        # Register the star in our galaxy
        connection.execute(
            """
            INSERT INTO migration_star_ids
            (source_hash, react_id, sqlite_id)
            VALUES (?, ?, ?)
            """,
            (source_hash, next_react_id, new_id)
        )

        # NEW: Record a historical snapshot
        record_galaxy_snapshot(
            connection,
            f"star-created:{new_id}"
        )

        # Commit all three changes together
        connection.commit()

        return {"id": new_id, **star}

    except Exception:
        connection.rollback()
        raise

    finally:
        connection.close()

def add_galaxy_connection(from_id, to_id, color=None):
    # A star cannot connect to itself
    if from_id == to_id:
        raise ValueError(
            "A star cannot connect to itself"
        )

    # Always store the smaller ID first
    first, second = sorted([from_id, to_id])

    connection = sqlite3.connect(DB_PATH)

    try:
        # Enforce SQLite foreign key constraints
        connection.execute("PRAGMA foreign_keys = ON")
        
        with connection:
            # Find our imported galaxy
            batch = connection.execute(
                """
                SELECT source_hash
                FROM migration_batches
                ORDER BY rowid DESC
                LIMIT 1
                """
            ).fetchone()

            if batch is None:
                raise LookupError(
                    "No imported galaxy found"
                )

            source_hash = batch[0]

            # Verify both stars belong to our galaxy
            rows = connection.execute(
                """
                SELECT sqlite_id
                FROM migration_star_ids
                WHERE source_hash = ?
                  AND sqlite_id IN (?, ?)
                """,
                (source_hash, first, second)
            ).fetchall()

            valid_ids = {row[0] for row in rows}

            if valid_ids != {first, second}:
                raise ValueError(
                    "Both stars must belong to this galaxy"
                )

            # Save the constellation connection
            connection.execute(
                """
                INSERT INTO connections
                (from_id, to_id, color)
                VALUES (?, ?, ?)
                """,
                (first, second, color)
            )
            
            print("DEBUG: Connection inserted")

            record_galaxy_snapshot(
                connection,
                f"connection-created:{first}-{second}"
            )

            print("DEBUG: Snapshot recorded")


            # Record the new constellation in our Time Machine
            record_galaxy_snapshot(
                connection,
                f"connection-created:{first}-{second}"
            )


        return {
            "from": first,
            "to": second,
            "color": color
        }

    finally:
        connection.close()


def delete_galaxy_connection(from_id, to_id):
    # A star cannot have a connection to itself
    if from_id == to_id:
        raise ValueError(
            "A star cannot connect to itself"
        )

    # Put the IDs in a consistent order
    first, second = sorted([from_id, to_id])

    connection = sqlite3.connect(DB_PATH)

    try:
        connection.execute("PRAGMA foreign_keys = ON")

        with connection:
            # Find our current imported galaxy
            batch = connection.execute(
                """
                SELECT source_hash
                FROM migration_batches
                ORDER BY rowid DESC
                LIMIT 1
                """
            ).fetchone()

            if batch is None:
                raise LookupError(
                    "No imported galaxy found"
                )

            source_hash = batch[0]

            # Make sure both stars belong to the galaxy
            rows = connection.execute(
                """
                SELECT sqlite_id
                FROM migration_star_ids
                WHERE source_hash = ?
                  AND sqlite_id IN (?, ?)
                """,
                (source_hash, first, second)
            ).fetchall()

            valid_ids = {row[0] for row in rows}

            if valid_ids != {first, second}:
                raise ValueError(
                    "Both stars must belong to this galaxy"
                )

            # Remove only this connection
            cursor = connection.execute(
                """
                DELETE FROM connections
                WHERE from_id = ? AND to_id = ?
                """,
                (first, second)
            )
            
        # Only record history if a connection was removed
        
            if cursor.rowcount > 0:
                print("DEBUG: Connection deleted")

                record_galaxy_snapshot(
                    connection,
                    f"connection-deleted:{first}-{second}"
                )

                print("DEBUG: Deletion snapshot recorded")



        return cursor.rowcount > 0

    finally:
        connection.close()


def save_initial_galaxy_snapshot():
    # Get the current SQLite galaxy
    galaxy = get_imported_galaxy()

    if galaxy is None:
        raise ValueError("No imported galaxy found")

    with sqlite3.connect(DB_PATH) as connection:

        # Create a table to store galaxy history
        connection.execute("""
            CREATE TABLE IF NOT EXISTS galaxy_snapshots (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                created_at TEXT NOT NULL
                    DEFAULT CURRENT_TIMESTAMP,
                action TEXT NOT NULL,
                snapshot_json TEXT NOT NULL
            )
        """)

        # Check whether the initial snapshot exists
        existing = connection.execute(
            """
            SELECT id
            FROM galaxy_snapshots
            WHERE action = 'baseline'
            LIMIT 1
            """
        ).fetchone()

        if existing:
            return {
                "status": "already exists",
                "snapshot_id": existing[0]
            }

        # Save our current galaxy as JSON
        cursor = connection.execute(
            """
            INSERT INTO galaxy_snapshots
            (action, snapshot_json)
            VALUES (?, ?)
            """,
            (
                "baseline",
                json.dumps(galaxy)
            )
        )

        return {
            "status": "created",
            "snapshot_id": cursor.lastrowid,
            "stars": len(galaxy["stars"]),
            "connections": len(galaxy["connections"])
        }


def record_galaxy_snapshot(connection, action):
    # Identify our current imported galaxy
    batch = connection.execute(
        """
        SELECT source_hash
        FROM migration_batches
        ORDER BY rowid DESC
        LIMIT 1
        """
    ).fetchone()

    if batch is None:
        raise ValueError("No imported galaxy found")

    source_hash = batch[0]

    # Retrieve the current stars in this galaxy
    rows = connection.execute(
        """
        SELECT
            s.id, s.name, s.category, s.progress,
            s.description, s.color, s.size,
            s.position_json, s.difficulty, s.orbit_json
        FROM stars AS s
        JOIN migration_star_ids AS m
            ON m.sqlite_id = s.id
        WHERE m.source_hash = ?
        ORDER BY s.id
        """,
        (source_hash,)
    ).fetchall()

    columns = [
        "id", "name", "category", "progress",
        "description", "color", "size",
        "position_json", "difficulty", "orbit_json"
    ]

    stars = []

    for row in rows:
        star = dict(zip(columns, row))

        star["position"] = json.loads(
            star.pop("position_json")
        )

        orbit_data = star.pop("orbit_json")
        star["orbit"] = (
            json.loads(orbit_data)
            if orbit_data is not None
            else None
        )

        stars.append(star)

    # Retrieve connections between galaxy stars
    links = connection.execute(
        """
        SELECT c.from_id, c.to_id, c.color
        FROM connections AS c
        JOIN migration_star_ids AS a
            ON a.sqlite_id = c.from_id
            AND a.source_hash = ?
        JOIN migration_star_ids AS b
            ON b.sqlite_id = c.to_id
            AND b.source_hash = ?
        ORDER BY c.from_id, c.to_id
        """,
        (source_hash, source_hash)
    ).fetchall()

    connections = [
        {"from":a, "to":b, "color":color}
        for a, b, color in links
    ]

    galaxy = {
        "stars": stars,
        "connections": connections
    }

    # Save the complete galaxy in history
    connection.execute(
        """
        INSERT INTO galaxy_snapshots
        (action, snapshot_json)
        VALUES (?, ?)
        """,
        (action, json.dumps(galaxy))
    )

def get_galaxy_history():
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row

    try:
        cursor = connection.execute(
            """
            SELECT id, action, created_at
            FROM galaxy_snapshots
            ORDER BY id DESC
            """
        )

        rows = cursor.fetchall()

        return [dict(row) for row in rows]

    finally:
        connection.close()


def get_galaxy_snapshot(snapshot_id):
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row

    try:
        cursor = connection.execute(
            """
            SELECT
                id,
                action,
                created_at,
                snapshot_json
            FROM galaxy_snapshots
            WHERE id = ?
            """,
            (snapshot_id,)
        )

        row = cursor.fetchone()

        if row is None:
            return None

        return {
            "id": row["id"],
            "action": row["action"],
            "created_at": row["created_at"],
            "galaxy": json.loads(
                row["snapshot_json"]
            )
        }

    finally:
        connection.close()

def get_galaxy_snapshot(snapshot_id):
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row

    try:
        cursor = connection.execute(
            """
            SELECT
                id,
                action,
                created_at,
                snapshot_json
            FROM galaxy_snapshots
            WHERE id = ?
            """,
            (snapshot_id,)
        )

        row = cursor.fetchone()

        if row is None:
            return None

        return {
            "id": row["id"],
            "action": row["action"],
            "created_at": row["created_at"],
            "galaxy": json.loads(
                row["snapshot_json"]
            )
        }

    finally:
        connection.close()



if __name__ == "__main__":
    initialize_database()
