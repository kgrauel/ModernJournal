import interface

SECRETS = interface.get_secrets()


def test_nonexistent_endpoint():
    """Tests that a nonexistent endpoint returns a 404 error."""

    result = interface.request("/api/i_am_an_error_and_i_do_not_exist", {})
    assert result["success"] == False
    assert result["message"] == "Could not communicate with endpoint."

def test_token_authentication():
    """Tests that authentication only works with a valid token."""

    test_valid_token = SECRETS["test_valid_token"]
    test_invalid_token = SECRETS["test_invalid_token"]
    
    valid_result = interface.ping(test_valid_token)
    assert valid_result["success"] == True
    assert valid_result["time_ms"] >= 0
    assert valid_result["email"] == SECRETS["test_users"][0]["email"]

    invalid_result = interface.ping(test_invalid_token)
    assert invalid_result["success"] == False
    assert invalid_result["message"] == "Unauthorized"


def test_email_password_authentication():
    """Tests that authentication only works with a valid email/password combination,
       and that the resulting tokens differ even for the same user across
       multiple logins."""

    test_valid_email = SECRETS["test_users"][0]["email"]
    test_valid_password = SECRETS["test_users"][0]["password"]
    test_invalid_email = "invalid@cnn.com"
    test_invalid_password = "invalidpassword"

    # Test valid login
    valid_result = interface.authenticate(test_valid_email, test_valid_password)
    assert valid_result["success"] == True
    assert valid_result["token"] != None

    # Ping to check token
    ping_result = interface.ping(valid_result["token"])
    assert ping_result["success"] == True
    assert ping_result["time_ms"] >= 0
    assert ping_result["email"] == test_valid_email

    # Test invalid login (email wrong)
    invalid_result = interface.authenticate(test_invalid_email, test_valid_password)
    assert invalid_result["success"] == False
    assert invalid_result["message"] == "Invalid email or password"

    # Test invalid login (password wrong)
    invalid_result = interface.authenticate(test_valid_email, test_invalid_password)
    assert invalid_result["success"] == False
    assert invalid_result["message"] == "Invalid email or password"

    # Test two valid logins don't give same token
    valid_result_2 = interface.authenticate(test_valid_email, test_valid_password)
    assert valid_result_2["success"] == True
    assert valid_result_2["token"] != None
    assert valid_result_2["token"] != valid_result["token"]

    # Ensure tokens are 32 characters long
    assert len(valid_result["token"]) == 32
    assert len(valid_result_2["token"]) == 32


def test_logout():
    """Tests that logging out invalidates the token."""

    test_valid_email = SECRETS["test_users"][0]["email"]
    test_valid_password = SECRETS["test_users"][0]["password"]

    # Test valid login
    valid_result = interface.authenticate(test_valid_email, test_valid_password)
    assert valid_result["success"] == True
    assert valid_result["token"] != None

    # Ping to check token
    ping_result = interface.ping(valid_result["token"])
    assert ping_result["success"] == True
    assert ping_result["time_ms"] >= 0
    assert ping_result["email"] == test_valid_email

    # Test logout
    logout_result = interface.logout(valid_result["token"])
    assert logout_result["success"] == True

    # Ping to check token
    ping_result = interface.ping(valid_result["token"])
    assert ping_result["success"] == False
    assert ping_result["message"] == "Unauthorized"

