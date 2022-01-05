# Users

MapMyMountains follows a permission model where each user must be explicitly authorized for doing a particular action.

Available permissions:
* `create_annotation`: permission to make annotations
* `create_campaign`: permission to create, edit, and delete campaigns 
* `edit_element`: permission to edit source elements directly
* `upload_peaks`: persmission to upload new sources
* `view_stats`: permission to view annotation statistics
* `edit_users`: premission to edit users
* `search`: premission to perform element searches

By default each user has the `create_annotation` permission.

## Get an user
`GET /users/:id`

Returns the user details.
- `id`: the ID of the user.
- `timestamp`: ISO-8601 date of when the user was created.
- `email`: email of the user.
- `preferred_area`: boundary of the area that the user is familiar with. Format is: [[lon1, lat1], ..., [lonX, latX]]
- `permissions`: the permissions that the user has.

Permission required: `edit_users` or none if the user is inquiring itself.

Response statuses: 200, 400, 401, 500

### Example:
```
> GET /users/james
> Authorization: uzh1v2xifuzh1v2xif4fmqnp9uftv4
>
< HTTP/1.1 200 OK
< Content-Type: application/json
<
{
	"id": "james",
	"timestamp": "2018-04-23T15:00:48",
	"email": "james@gotmail.com",
	"preferred_area": [
		[9.109, 45.799],
		[9.346, 45.799],
		[9.346, 45.973],
		[9.109, 45.973]
	],
	"permissions": ["create_annotation"]
}
```

## Create an user
This function creates a new user. By default the user belongs to the worker group.
The user should be activated by opening the verification link sent to its email.

| Name             | Type         | Description                                                                      |
|------------------|--------------|----------------------------------------------------------------------------------|
| `id`             | `string`     | **Required**. The ID of the user.                                                |
| `password`       | `string`     | **Required**. The user password.                                                 |
| `email`          | `string`     | **Required.** The email of the user.                                             |
| `preferred_area` | `number[][]` | The area the user is familiar with. Format is: [[lon1, lat1], ..., [lonX, latX]] |

Permission required: none

Response statuses: 200, 400, 409, 500

### Example:
```
> POST api/v1/users
> Content-Type: application/json
>
{
	"id": "james",
	"password": "chopsticks",
	"email": "james@gotmail.com"
}
< HTTP/1.1 200 OK
< Content-Type: application/json
<
{
	"id": "james",
	"creation_time": "2018-04-23T15:00:48",
	"email": "james@gotmail.com",
	"group": "worker",
	"permissions": ["create_annotation"]
}
```

## Activate an user
`GET /users/:id/activate/:code`

This function activates an user account. It should be called (indirectly) from an email sent to the user after registration.

Permission required: none

Response statuses: 204, 403, 500

### Example:
```
> GET /users/james/activate/fbeJsmC1
>
< HTTP/1.1 204 No Content
<
```

## Get all users
`GET /users`

Returns the details of all registered users.

Permission required: `edit_users`

Response statuses: 200, 400, 401, 403, 500

Example:
```
> GET /users
> Authorization: uzh1v2xifuzh1v2xif4fmqnp9uftv4
>
< HTTP/1.1 200 OK
< Content-Type: application/json
<
[
	{
		"id": "james",
		"creation_time": "2018-04-23T15:00:48",
		"email": "james@gotmail.com",
		"preferred_area": [
			[9.109, 45.799],
			[9.346, 45.799],
			[9.346, 45.973],
			[9.109, 45.973]
		],
		"permissions": ["create_annotation"],
		"active": true
	},
	{
		"id": "robert",
		"creation_time": "2018-04-26T11:43:00",
		"email": "robert@tyrellcorp.com",
		"permissions": ["create_annotation", "edit_element"],
		"active": true
	}
]
```

## Update an user
`PATCH /users/:id`

Updates the user details like email, password or group.

Permission required: `edit_users` or none if the user logged in is uptating itself (except for its own permissions).

Response statuses: 200, 400, 401, 403, 500

#### Example:
```
> PATCH /users/james
> Authorization: uzh1v2xifuzh1v2xif4fmqnp9uftv4
> Content-Type: application/json
>
{
	"email": "james@supermail.com",
	"password": "forks",
	"permissions": [
		"create_annotation",
		"create_campaign",
		"view_stats"
	]
}
< HTTP/1.1 200 OK
< Content-Type: application/json
<
{
	"id": "james",
	"creation_time": "2018-04-23T15:00:48",
	"email": "james@supermail.com",
	"group": "manager",
	"permissions": [
		"create_annotation",
		"create_campaign",
		"view_stats"
	]
}
```

## Delete an user
`DELETE /users/:id`

Permission required: `edit_users`

Response statuses: 200, 400, 401, 403, 500

#### Example:
```
> DELETE /users/james
> Authorization: uzh1v2xifuzh1v2xif4fmqnp9uftv4
>
< HTTP/1.1 200 OK
<
```

## Request password reset
`POST /users/:id/password_reset`

An email with a special link to reset the password is sent to the user email address.

Permission required: none.

Response statuses: 200, 404, 500


## User password reset
`POST /users/:id/password_reset/:code`

Reset the user password.

Parameters:

| Name             | Type         | Description                      |
|------------------|--------------|----------------------------------|
| `password`       | `string`     | **Required**. The new password.  |

Permission required: none.

Response statuses: 200, 400, 404, 500
