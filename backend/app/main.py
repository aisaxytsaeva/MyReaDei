from fastapi import FastAPI

app = FastAPI(
    title = "Bookcrossing platform"
)

@app.get("/")
async def root():
    return {"message": "Running"}