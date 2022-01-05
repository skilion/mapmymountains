# Areas

Areas are resources representing boundaries in GPS coordinates. An area has the following properties:

| Name            | Type       | Description                                                             |
|-----------------|------------|-------------------------------------------------------------------------|
| `id`            | string     | **Required.** ID of the area.                                           |
| `user_id`       | string     | **Required.** Author of the area.                                       |
| `creation_time` | string     | **Required.** ISO 8601 date.                                            |
| `boundary`      | number[][] | **Required.** Polygon in the format [[lon1, lat1], ..., [lonN, latN]].  |

## List areas
`GET /area`

List all available areas.

Permission required: none

Response statuses: 200, 401, 500

### Example:
```
> GET /areas
>
< HTTP\1.1 200 OK
< Content-Type: application/json
<
[
	{
		"id": "Area 1",
		"user_id": "john",
		"creation_time": "2018-10-16T07:44:05Z",
		"boundary": [
			[6.767578, 46.179830],
			[9.832775, 47.754098],
			[9.931641, 46.179830]
		]
	},
	{
		"id": "Area 2",
		"user_id": "mike",
		"creation_time": "2018-09-08T13:21:00Z",
		"boundary": [
			[3.647461, 45.644768],
			[9.931641, 45.644768],
			[9.931641, 47.754098]
			[3.647461, 47.754098]
		]
	}
]
```

## Create new area
`POST /area/:id`

Can be used only if the user has the `create_campaign` permission. If the area ID already exists, it will be overwritten.

Permission required: `create_campaign`

Response statuses: 201, 400, 401, 403, 500

### Example:
```
> POST /areas/my+area
>
{
	"boundary": [
		[6.767578, 46.179830],
		[9.832775, 47.754098],
		[9.931641, 46.179830]
	]
}

< HTTP\1.1 200 OK
< Content-Type: application/json
<
{
	"id": "my area",
	"user_id": "bill",
	"creation_time": "2018-10-19T11:51:33Z",
	"boundary": [
		[3.647461, 45.644768],
		[11.997070, 45.644768],
		[11.997070, 47.754098],
		[3.647461, 47.754098]
	]
}
```

## Delete an area
`DELETE /area/:id`

Permission required: `create_campaign`

Response statuses: 204, 400, 401, 403, 404, 500
