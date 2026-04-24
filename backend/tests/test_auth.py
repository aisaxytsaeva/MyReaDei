class TestAuth:

    def test_register_success(self, client):
        response = client.post("/auth/register", json={
            "username": "newuser",
            "email": "new@example.com",
            "password": "SecurePass123!"
        })
        assert response.status_code in [200, 201]

        data = response.json()
        assert data["username"] == "newuser"
        assert data["email"] == "new@example.com"

    def test_register_duplicate_username(self, client, test_user):
        response = client.post("/auth/register", json={
            "username": test_user.username,
            "email": "unique@example.com",
            "password": "SecurePass123!"
        })
        assert response.status_code == 400
        detail = response.json().get("detail", "")
        assert "существует" in detail or "already exists" in detail

    def test_login_success(self, client, test_user):
        response = client.post(
            "/auth/login",
            data={
                "username": "testuser",
                "password": "test_1111"
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )

        if response.status_code != 200:
            print(f"Response status: {response.status_code}")
            print(f"Response body: {response.text}")

        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data

    def test_login_wrong_password(self, client, test_user):
        response = client.post(
            "/auth/login",
            data={
                "username": test_user.username,
                "password": "wrong_password"
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        assert response.status_code == 401