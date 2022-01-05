# Statistics

## Get statistics
`GET /stats`

Return statistics about the annotations. Requires the `view_stats` permission.

Permission required: `view_stats`

Response statuses: 200, 401, 500

### Example:
```
> GET /stats
> Authorization: uzh1v2xifuzh1v2xif4fmqnp9uftv4
>
< HTTP/1.1 200 OK
< Content-Type: application/json
<
{
	"top_annotators": [
		{
			"user_id": "james",
			"num_annotations": 100
		},
		{
			"user_id": "john",
			"num_annotations": 80
		},
		{
			"user_id": "mark",
			"num_annotations": 42
		}
	],
	"top_campaigns": [
		{
			"campaign_id": 2,
			"name": "Triangolo Lariano",
			"num_annotations": 140
		},
		{
			"campaign_id": 6,
			"name": "Alpi Orobie",
			"num_annotations": 93
		},
		{
			"campaign_id": 7,
			"name": "Dolomiti",
			"num_annotations": 36
		}
	],
	"daily_annotations": [
		{
			"date": "2018-08-23",
			"num_annotations": 40
		},
		{
			"date": "2018-08-24",
			"num_annotations": 75
		},
		{
			"date": "2018-08-25",
			"num_annotations": 53
		}
	]
}
```
