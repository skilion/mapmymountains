# Authentication

## Perform login
`POST /login`

Returns a token that must be sent with the `Authorization` HTTP header to be authorized to use other API functions.

**NOTE**: credentials are sent in clear text, HTTPS should be implemented in the production environment.

Response statuses: 200, 400, 401, 500

#### Example:
```
> POST /login
> Content-Type: application/json
>
{
	"user": "james",
	"password": "chopsticks"
}
< HTTP\1.1 200 OK
< Content-Type: application/json
<
{
	"token": "uzh1v2xifuzh1v2xif4fmqnp9uftv4"
	"expiration_time": "2018-05-14T15:51:58+00:00"
}
```

## Refresh authorization token
`POST /login/refresh`

If the authorization token is about to expire, the client may decide to get a new one.

Response statuses: 200, 400, 401, 500

#### Example:
```
> POST /login/refresh
> Authorization: uzh1v2xifuzh1v2xif4fmqnp9uftv4
>
< HTTP\1.1 200 OK
< Content-Type: application/json
<
{
	"token": "fmgog05jgo4smzla0386mcld03dgmn"
	"expiration_time": "2018-05-14T18:00:03+00:00"
}
```
