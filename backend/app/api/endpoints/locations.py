from fastapi import APIRouter

router = APIRouter()



@router.post("/")
async def create_location():
    return 

@router.get("/map")
async def get_locations_map():
    return {"locations": []}

@router.get("/{location_id}")
async def get_location(location_id: int):

    return 