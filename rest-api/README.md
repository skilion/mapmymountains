# Map My Mountains REST API
This app offers a set of HTTP REST APIs to interact with the Map My Mountains database with proper authentication.

## Installation
Edit `config.json` to match your environment:
* `port`: port to use
* `db_user`: database username
* `db_pass`: database password
* `db_address`: database address
* `db_name`: name of the database to use
* `token_duration_sec`: duration of a token (how much an user is logged in)
* `website_address`: URL of the website
* `feedback_email`: email to receive the user feedbacks
* `nodemailer`: nodemailer transport object, see: https://nodemailer.com/smtp/

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
