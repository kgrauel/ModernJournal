# Version 0.0.1

- [x] Move getSecrets into a separate module, have it cache the result
- [x] Finish implementing the middleware validator
- [x] In fe_cli, use requests to hit the authenticate endpoint
- [x] Verify that the validation fails in a reasonable way using some sort of testing library
- [x] Test session generation
- [x] /api/ping endpoint to let client check auth worked
- [x] Session timeout logic
- [x] Set up backend unit testing framework

- [ ] Logout endpoint & tests


- [ ] Figure out how to get the user's IP address from the request
- [ ] Log requests in a collection with a 60-second TTL
- [ ] Log security failures in a collection with a 24-hour TTL
- [ ] Rate limit requests and secfails with a middleware
- [ ] Test rate limiting


