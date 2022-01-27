# Map My Mountains REST API
This app offers a set of HTTP REST APIs to interact with the Map My Mountains database with  authentication.

## Installation
Copy `.env` to `.evn.local` and edit it to match your environment:
* `PORT`: port to use
* `DB_USER`: database username
* `DB_PASS`: database password
* `DB_ADDRESS`: database address
* `DB_NAME`: name of the database to use
* `TOKEN_DURATION_SEC`: duration of a token (how long an user stays logged in)
* `WEBSITE_ADDRESS`: URL of the website
* `FEEDBACK_EMAIL`: email to receive the user feedbacks
* `NODEMAILER_*`: parameters of the nodemailer transport object, see: https://nodemailer.com/smtp/

``` bash
# install project dependencies
npm install
```

## Usage
```sh
# Run the server
npm start

# Run the tests
npm run test
```

## Production
To run the REST API in production, use a process manager such as PM2.

```sh
# Install PM2
sudo npm install -g pm2

# Activate atartup hook (follow the instructions)
pm2 startup

# Run the server
pm2 start ./bin/www --name rest-api

# Save the running applications
pm2 save
```

## REST API Documentation
All functions are prefixed by `/api/v1`.

The API uses [authentication](docs/auth.md).

The meaning of the used HTTP response codes are:
* 200 (OK): the function completed successfully.
* 201 (Created): the function completed successfully and created a new resource.
* 204 (No Content): the function completed successfully but does not need to return an entity-body.
* 400 (Bad Request): the function parameters are wrong.
* 401 (Unauthorized): the authorization token has not been provided, is expired, or is wrong.
* 403 (Forbidden): the user does not have the permission to access the resource.
* 404 (Not Found): the requested resource could not be found.
* 409 (Conflict): the function cannot create the specified resource because it already exists.
* 500 (Internal Server Error): an error happened during the function execution.

Topics:
- [Annotations](docs/annotations.md)
- [Areas](docs/areas.md)
- [Campaigns](docs/campaigns.md)
- [Feedback](docs/feedback.md)
- [Search](docs/search.md)
- [Sources](docs/sources.md)
- [Statistics](docs/stats.md)
- [Users](docs/users.md)
