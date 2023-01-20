# Version 0.0.1

- [x] Move getSecrets into a separate module, have it cache the result
- [x] Finish implementing the middleware validator
- [x] In fe_cli, use requests to hit the authenticate endpoint
- [x] Verify that the validation fails in a reasonable way using some sort of testing library
- [x] Test session generation
- [x] /api/ping endpoint to let client check auth worked
- [x] Session timeout logic
- [x] Set up backend unit testing framework
- [x] Logout endpoint & tests
- [x] Figure out how to get the user's IP address from the request
- [x] Log requests
- [x] Rate limit requests
- [x] Allow the use of a secrets override file for testing
  - [x] Did it for nuke_database and clear_db
  - [ ] Do it for server.js so testing can open server directly
- [ ] Have the tests initialize a separate database, run testing server
- [ ] Create testing endpoints that allow rate limiting to be turned on or off
- [ ] Test rate limiting
- [ ] Test logout all



