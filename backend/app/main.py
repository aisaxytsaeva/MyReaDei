from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from api.endpoints import auth_router, books_router, users_router, locations_router, reservation_router, statitics_router 
import time
import logging


logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


app = FastAPI(
    title="Bookcrossing platform",
    version="1.0.0",
    description="API для bookcrossing платформы",
    docs_url="/docs",
)


app.mount("/static", StaticFiles(directory="static"), name="static")



origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,          # НЕ "*"
    allow_credentials=True,         # если используешь cookies/сессию
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    
    logger.info(
        f"INCOMING: {request.method} {request.url.path} | "
        f"Client: {request.client.host if request.client else 'unknown'}"
    )

    response = await call_next(request)

    process_time = time.time() - start_time

    logger.info(
        f"📤 RESPONSE: {request.method} {request.url.path} | "
        f"Status: {response.status_code} | "
        f"Time: {process_time:.3f}s"
    )

    response.headers["X-Process-Time"] = str(process_time)
    
    return response

app.include_router(auth_router, prefix="", tags=["auth"])
app.include_router(users_router, prefix="", tags=["users"])
app.include_router(books_router, prefix="", tags=["books"])
app.include_router(locations_router, prefix="", tags=["locations"])  
app.include_router(reservation_router, prefix="", tags=["reservations"]) 
app.include_router(statitics_router, prefix="", tags=["statistics"])  


@app.get("/")
async def root():
    return {"message": "Running"}