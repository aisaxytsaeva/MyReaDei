from fastapi import APIRouter

router = APIRouter()

@router.post("/")
async def create_reservation():
    return


@router.get("/")
async def get_reservation():
    return 


@router.post("/{reservation_id}/confirm")
async def confirm_reservation(reservation_id: int):
    return


@router.post("/{reservation_id}/return")
async def return_book(reservation_id: int):
  
    return {"message": f"The borrowed book {reservation_id} is returned by user"}


@router.delete("/{reservation_id}")
async def cancel_reservation(reservation_id: int):
   
    return {"message": f"The booking {reservation_id} is canceled"}