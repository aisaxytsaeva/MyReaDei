from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.endpoints import auth_router, books_router, users_router, locations_router, reservation_router, statitics_router 

app = FastAPI(
    title = "Bookcrossing platform"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="", tags=["auth"])
app.include_router(users_router, prefix="", tags=["users"])
app.include_router(books_router, prefix="", tags=["books"])
app.include_router(locations_router, prefix="", tags=["locations"])  
app.include_router(reservation_router, prefix="", tags=["reservations"]) 
app.include_router(statitics_router, prefix="", tags=["statistics"])  


@app.get("/")
async def root():
    return {"message": "Running"}