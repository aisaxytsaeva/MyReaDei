from fastapi import FastAPI
from api.endpoints import auth_router, books_router, users_router, locations_router, reservation_router, statitics_router 

app = FastAPI(
    title = "Bookcrossing platform"
)


app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(users_router, prefix="/users", tags=["users"])
app.include_router(books_router, prefix="/books", tags=["books"])
app.include_router(locations_router, prefix="locations", tags=["locations"])
app.include_router(reservation_router, prefix="reservation", tags=["reservation"])
app.include_router(statitics_router, prefix="statistics", tags=["statistics"])


@app.get("/")
async def root():
    return {"message": "Running"}