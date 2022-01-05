# Search

## Search peaks
`GET /search`

Search peaks by name. Returns the top 100 results that best match the search string.

Permission required: `search`

Response statuses: 200, 400, 500

### Parameters:
| Name   | Type   | Description                                                 |
|--------|--------|-------------------------------------------------------------|
| q      | string | **Required.** Search keywords.                              |

If `q` is a single number the search is performed by ID. If `q` is a string the search is perfomed by name.

The `q` parameter can contain search qualifiers:
- `source`: source to filter the search with (example: `source:OpenStreetMap`). It can be repeated.

### Example:
```
> GET /search?q=aiguille+source:OpenStreetMap+source:GeoNames
> Authorization: uzh1v2xifuzh1v2xif4fmqnp9uftv4
>

< HTTP\1.1 200 OK
< Content-Type: application/json
<
[
	{
		"id": 3957958,
		"version": 0,
		"element_id": 3932300,
		"source_id": "GeoNames",
		"timestamp": "2018-06-06T16:43:30.440Z",
		"lon": 6.28333,
		"lat": 44.91667,
		"elevation": 3421,
		"name": "Grande Aiguille de la Bérarde",
		"source_type": "geonames",
		"geoname_id": 3015252,
		"geoname_mtime": "2016-02-17T23:00:00.000Z",
		"alternate_names": [
			{
				"isolanguage": null,
				"alternate_name": "Grande Aiguille de la Bérarde"
			},
			{
				"isolanguage": null,
				"alternate_name": "La Grande Aiguille"
			}
		]
	},
	{
		"id": 8274430,
		"version": 0,
		"element_id": 7117470,
		"source_id": "OpenStreetMap",
		"timestamp": "2018-06-13T08:24:46.300Z",
		"lon": 6.8146106,
		"lat": 45.7945743,
		"elevation": 3920,
		"name": "Aiguille de Tré-la-Tête Centrale Sud-Est",
		"wikidata_id": "Q31612160",
		"source_type": "osm",
		"osm_id": "26862463",
		"osm_version": 12,
		"alternate_names": [
			{
				"isolanguage": null,
				"alternate_name": "Aiguilles de Tré la Tête"
			}
		]
	}
]
```
