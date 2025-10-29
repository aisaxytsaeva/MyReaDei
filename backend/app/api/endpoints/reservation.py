from fastapi import APIRouter

from backend.app.schemas.reservation import ReservationCreate, ReservationResponse

router = APIRouter()

@router.post("/", response_model=ReservationResponse)
async def create_reservation(reservation_data: ReservationCreate):
    return ReservationResponse(
        id=1,
        book_id=reservation_data.book_id,
        book_title="Пример книги",
        status="pending",
        created_at="2024-01-01",
        planned_return_date="2024-01-08",
        selected_location={"id": 1, "name": "Метро Курская"}
    )


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