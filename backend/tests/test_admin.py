import pytest
from app.models.locations import Location
from app.models.users import User
from app.core.permissions import UserRole


class TestAdminAccess:

    @pytest.fixture
    def test_user_for_admin(self, db_session):
        from app.core.security import get_password_hash

        user = User(
            id=100,
            username="testuser123",
            email="testuser123@example.com",
            password_hash=get_password_hash("test123"),
            is_active=True,
            role="user"
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        return user

    def test_user_cannot_access_admin_endpoints(self, client, auth_headers):
        response = client.get("/admin/users", headers=auth_headers)
        assert response.status_code in [403, 401]

        response = client.put(
            "/admin/users/1/role",
            headers=auth_headers,
            json={"role": "admin"}
        )
        assert response.status_code in [403, 401]

        response = client.get("/admin/books/for-delete", headers=auth_headers)
        assert response.status_code in [403, 401]

    def test_unauthorized_cannot_access_admin_endpoints(self, client):
        response = client.get("/admin/users")
        assert response.status_code == 401