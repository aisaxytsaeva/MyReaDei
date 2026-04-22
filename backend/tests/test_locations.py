import pytest
from app.models.locations import Location
from app.crud import locations as locations_crud
from app.schemas.location import LocationCreate

class TestLocations:

    def test_create_location_success(self, db_session, test_user):
        location_data = LocationCreate(
            name="Памятник Ленину",
            address="Улица Ленина, 18",
            latitude=55.7558,
            longitude=37.6176
        )
        
        location = locations_crud.create_location(
            db_session, location_data, test_user.id
        )
        
        assert location.id is not None
        assert location.name == "Памятник Ленину"
        assert location.is_approved is False  

    def test_get_pending_locations(self, db_session, test_user):
        location_data = LocationCreate(
            name="Pending Library",
            address="456 Pending St",
            latitude=55.7558,
            longitude=37.6176
        )
        locations_crud.create_location(db_session, location_data, test_user.id)
        
        pending = locations_crud.get_locations_pending_approval(db_session)
        
        assert len(pending) >= 1
        assert pending[0].is_approved is False

    def test_approve_location_by_admin(self, db_session, test_user):
        location_data = LocationCreate(
            name="To Approve",
            address="789 Approve St",
            latitude=55.7558,
            longitude=37.6176
        )
        location = locations_crud.create_location(db_session, location_data, test_user.id)
        
        approved = locations_crud.approve_location(db_session, location.id)
        
        assert approved.is_approved is True

    def test_delete_location(self, db_session, test_user):
        location_data = LocationCreate(
            name="To Delete",
            address="222 Delete St",
            latitude=55.7558,
            longitude=37.6176
        )
        location = locations_crud.create_location(db_session, location_data, test_user.id)
        
        result = locations_crud.delete_location(db_session, location.id)
        
        assert result is True
        assert db_session.query(Location).filter(Location.id == location.id).first() is None