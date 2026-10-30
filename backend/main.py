from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
import sqlite3
from database import (
    initialize_database,
    get_all_stars,
    insert_star,
    update_star,
    delete_star,
    get_all_connections,
    get_imported_galaxy,
    create_galaxy_star,
    add_galaxy_connection,
    delete_galaxy_connection,
    get_galaxy_history,
    get_galaxy_snapshot
)

# Create our API application
app = FastAPI(
    title="Universe of Possibilities API",
    description="A backend for managing dreams and goals",
    version="1.0.0"
)
initialize_database()

# Allow our React frontend to contact this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5175",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5175",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {
        "message": "Welcome to Universe of Possibilities!",
        "status": "online"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Universe Backend"
    }



@app.get("/stars")
def get_stars():
    return get_all_stars()


@app.get("/connections")
def get_connections():
    return get_all_connections()


@app.get("/galaxy")
def get_galaxy():
    galaxy = get_imported_galaxy()

    if galaxy is None:
        raise HTTPException(
            status_code=404,
            detail="No imported galaxy found"
        )

    return galaxy



class StarCreate(BaseModel):
    name: str = Field(min_length=1)
    category: str = Field(min_length=1)
    progress: int = Field(default=0, ge=0, le=100)


class Star3DCreate(StarCreate):
    description: str = ""
    color: str = "#38bdf8"
    size: float = Field(default=0.4, gt=0)

    position: list[float] = Field(
        default_factory=lambda: [0.0, 0.0, 0.0],
        min_length=3,
        max_length=3
    )

    difficulty: str = "Not set"
    orbit: dict[str, float] | None = None


class GalaxyConnectionCreate(BaseModel):
    from_id: int = Field(gt=0)
    to_id: int = Field(gt=0)
    color: str | None = None



@app.post("/stars", status_code=201)
def create_star(star: Star3DCreate):
    return insert_star(
        name=star.name,
        category=star.category,
        progress=star.progress,
        description=star.description,
        color=star.color,
        size=star.size,
        position=star.position,
        difficulty=star.difficulty,
        orbit=star.orbit
    )




@app.put("/stars/{star_id}")
def update_existing_star(star_id: int, star: Star3DCreate):
    updated = update_star(
        star_id=star_id,
        name=star.name,
        category=star.category,
        progress=star.progress,
        description=star.description,
        color=star.color,
        size=star.size,
        position=star.position,
        difficulty=star.difficulty,
        orbit=star.orbit
    )

    if updated is None:
        raise HTTPException(
            status_code=404,
            detail="Star not found"
        )

    return updated

    updated = update_star(
        star_id,
        star.name,
        star.category,
        star.progress
    )

    if updated is None:
        raise HTTPException(
            status_code=404,
            detail="Star not found"
        )

    return updated


@app.delete("/stars/{star_id}", status_code=204)
def remove_existing_star(star_id: int):
    deleted = delete_star(star_id)

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Star not found"
        )



@app.post("/galaxy/stars", status_code=201)
def add_galaxy_star(star: Star3DCreate):
    try:
        return create_galaxy_star(
            star.model_dump()
        )

    except ValueError as error:
        raise HTTPException(
            status_code=404,
            detail=str(error)
        ) from error


@app.post("/galaxy/connections", status_code=201)
def create_galaxy_connection(
    link: GalaxyConnectionCreate
):
    try:
        return add_galaxy_connection(
            from_id=link.from_id,
            to_id=link.to_id,
            color=link.color
        )

    except LookupError as error:
        raise HTTPException(
            status_code=404,
            detail=str(error)
        ) from error

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error)
        ) from error

    except sqlite3.IntegrityError as error:
        raise HTTPException(
            status_code=409,
            detail="Connection already exists or violates a database constraint"
        ) from error


@app.delete(
    "/galaxy/connections/{from_id}/{to_id}",
    status_code=204
)
def remove_galaxy_connection(
    from_id: int,
    to_id: int
):
    try:
        deleted = delete_galaxy_connection(
            from_id,
            to_id
        )

        if not deleted:
            raise HTTPException(
                status_code=404,
                detail="Connection not found"
            )

    except LookupError as error:
        raise HTTPException(
            status_code=404,
            detail=str(error)
        ) from error

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error)
        ) from error


@app.get("/galaxy/history")
def galaxy_history():
    return get_galaxy_history()


@app.get("/galaxy/history/{snapshot_id}")
def galaxy_snapshot(snapshot_id: int):
    snapshot = get_galaxy_snapshot(snapshot_id)

    if snapshot is None:
        raise HTTPException(
            status_code=404,
            detail="Snapshot not found"
        )

    return snapshot
