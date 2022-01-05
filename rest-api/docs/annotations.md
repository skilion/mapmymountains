# Annotations
An annotation is characterized by the following properties:

| Name                    | Type    | Description                                                                                                         |
|-------------------------|---------|---------------------------------------------------------------------------------------------------------------------|
| source_element_id       | number  | **Required.** ID of the annotated peak. `null` if the annotations is for a new peak that does not exists in the db. |
| source_element_version  | number  | **Required.** Version of the annotated element. `null` if the peak is new.                                          |
| campaign_id             | number  | **Required.** ID of the campaign to which the annotation belong.                                                    |
| valid                   | boolean | **Required.** `true` to mark the element as existent, `false` otherwise.                                            |
| name                    | string  | Official name.                                                                                                      |
| alternate_names         | array   | Array of `alternate_name`.                                                                                          |
| lat                     | number  | Latitude.                                                                                                           |
| lon                     | number  | Longitude.                                                                                                          |
| elevation               | number  | Peak elevation.                                                                                                     |
| similar_element_id      | number  | ID of the element that is similar to the annotated one.                                                             |
| similar_element_version | boolean | version of the similar element.                                                                                     |

An `alternate_name` is composed of:

| Name              | Type    | Description                                                                  |
|-------------------|---------|------------------------------------------------------------------------------|
| isolanguage       | string  | ISO language code of the alternate name.                                     |
| alternate_name    | string  | Alternate name.                                                              |

## Create an annotation
`POST /annotations`

This function creates an annotation and returns it. If the user has already annotated
the element (in the specified campaign) the old annotation is updated.

Permission required: `create_annotation`

Response statuses: 200, 400, 401, 500

Example:
```
> POST /annotations
> Authorization: uzh1v2xifuzh1v2xif4fmqnp9uftv4
> Content-Type: application/json
>
{
	"campaign_id": 244,
	"source_element_id": 1143220,
	"source_element_version": 0,
	"valid": true,
	"name": "Matterhorn",
	"alternate_names": [
		{
			"isolanguage": "it",
			"alternate_name": "Cervino"
		}
	]
}
< HTTP\1.1 200 OK
< Content-Type: application/json
<
{
	"id": 5840,
	"campaign_id": 244,
	"source_element_id": 1143220,
	"source_element_version": 0,
	"valid": true,
	"name": "Matterhorn",
	"alternate_names": [
		{
			"isolanguage": "it",
			"alternate_name": "Cervino"
		}
	]
}
```

## List annotations
`GET /annotations/:campaign_id`

This function lists the annotations made in a specific campaign aggregated by source
element ID.

Permission required: `view_stats`

Response statuses: 200, 400, 401, 500

Example:
```
> GET /annotations/239
> Authorization: uzh1v2xifuzh1v2xif4fmqnp9uftv4
>
< HTTP\1.1 200 OK
< Content-Type: application/json
<
{
	"9535781": [
		{
			"id": 5840,
			"user_id": "john",
			"campaign_id": 239,
			"source_element_id": 1143220,
			"source_element_version": 0,
			"creation_time": "2018-10-22T15:56:24"
			"name": "Matterhorn",
			"valid": true
		},
		{
			"id": 5843,
			"user_id": "mark",
			"campaign_id": 239,
			"source_element_id": 1143220,
			"source_element_version": 0,
			"creation_time": "2018-10-21T15:34:11"
			"valid": true,
			"alternate_names": [
				{
					"isolanguage": "it",
					"alternate_name": "Cervino"
				}
			]
		}
	],
	"9535782": []
}
```
