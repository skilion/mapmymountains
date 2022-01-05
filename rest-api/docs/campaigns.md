# Campaigns
A campaign has the following properties:

| Name          | Type       | Description                                                                 |
|---------------|------------|-----------------------------------------------------------------------------|
| name          | string     | **Required.** Name of the campaign.                                         |
| description   | string     | **Required.** Description of the campaign.                                  |
| start_time    | date       | **Required.** Starting date.                                                |
| end_time      | date       | **Required.** End date.                                                     |
| boundary      | number[][] | **Required.** Polygon in the format `[[lng1, lat1], ... , [lngX, latX]]`.   |
| source_id     | string     | **Required** ID of the source to validate.                                  |
| ref_source_id | string     | ID of the source to use as reference.                                       |

## List campaigns
`GET /campaigns`

Returns the active campaigns. If the user has the `create_campaign` permission the inactive campaigns are also returned.

Response statuses: 200, 401, 403, 500

### Example
```
> GET /campaigns
> Authorization: uzh1v2xifuzh1v2xif4fmqnp9uftv4
>

< HTTP\1.1 200 OK
< Content-Type: application/json
<
[
	{
		"id": 445,
		"name": "Lombardia2018",
		"description": "Validazione dei picchi del triangolo lariano",
		"start_time": "2018-03-01T00:00Z",
		"end_time": "2018-12-01T00:00Z",
		"boundary": [
			[9.06,45.08],
			[9.45,45.08],
			[9.45,45.99],
			[9.06,45.99]
		],
		"source_id": "2018-01-20T15:46 N46E009"
		"ref_source_id": "OpenStreetMap"
	},
	{
		"id": 446,
		"name": "LombardiaMerge2018",
		"description": "Conflitti della fusione OSM-GeoNames in Lombardia",
		"start_time": "2018-03-01T00:00Z",
		"end_time": "2018-05-22T00:00Z",
		"boundary": [
			[9.06,45.08],
			[9.45,45.08],
			[9.45,45.99],
			[9.06,45.99]
		],
		"merge_list": "lombardia_conflicts"
	}
]
```

## Get campaign details
`GET /campaigns/:id`

Return the details of campaign which consists of:
* the properties of the campaign.
* the list of peaks to annotate with the respective annotation, if `source_id` is set.
* the list of reference peaks, if `ref_source_id` is set.

Response statuses: 200, 400, 401, 403, 500

### Example
```
> GET /campaigns/445
> Authorization: uzh1v2xifuzh1v2xif4fmqnp9uftv4
>

< HTTP\1.1 200 OK
< Content-Type: application/json
<
{
	"id": 445,
	"name": "Validation01",
	"description": "Validation test",
	"start_time": "2018-03-01T00:00Z",
	"end_time": "2018-12-01T00:00Z",
	"boundary": [
		[9.06,45.08],
		[9.45,45.08],
		[9.45,45.99],
		[9.06,45.99]
	],
	"source_id": "2018-01-20T15:46 N46E009"
	"ref_source_id": "OpenStreetMap"
	"peaks": [
		{
			"id": 9535781,
			"lon": 6.5712,
			"lat": 45.3588,
			annotation: {
				"id": 5840,
				"source_element_id": 9535781,
				"name": "Roc de Tougne",
				"valid": true
			}
		},
		{
			"id": 9535782,
			"lon": 6.86344,
			"lat": 45.83479,
		}
	],
	"ref_peaks": [
		{
			"id": 8744892,
			"lon": 6.5623714,
			"lat": 45.3572321,
			"name": "Roc de Tougne 2535"
		},
		{
			"id": 3965316,
			"lon": 6.864,
			"lat": 45.833,
			"elevation": 4810,
			"name": "Mont Blanc"
		}
	]
}
```

## Create a campaign
`POST /campaigns`

Creates a new campaign.

Permission required: `create_campaign`

Response statuses: 201, 400, 401, 403, 500

### Create validation campaign example
```
> POST /campaigns
> Content-Type: application/json
>
{
	"name": "Lombardia2018",
	"description": "Validazione dei picchi del triangolo lariano",
	"start_time": "2018-03-01T00:00Z",
	"end_time": "2018-12-01T00:00Z",
	"bounding_box": [
		[9.06,45.08],
		[9.45,45.08],
		[9.45,45.99],
		[9.06,45.99]
	],
	"source_id": "2018-01-20T15:46 N46E009"
	"ref_source_id": "OpenStreetMap"
}

< HTTP\1.1 200 OK
< Content-Type: application/json
<
{
	"id": 445,
	"name": "Lombardia2018",
	"description": "Validazione dei picchi del triangolo lariano",
	"start_time": "2018-03-01T00:00Z",
	"end_time": "2018-12-01T00:00Z",
	"bounding_box": [
		[9.06,45.08],
		[9.45,45.08],
		[9.45,45.99],
		[9.06,45.99]
	],
	"source_id": "2018-01-20T15:46 N46E009"
	"ref_source_id": "OpenStreetMap"
}
```

## Delete campaign
`DELETE /campaigns/:id`

Deletes a campaign.

Permission required: `create_campaign`

Response statuses: 204, 400, 401, 403, 500
