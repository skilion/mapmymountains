# Sources

'Sources' are intended as generic sources of geographic elements. The only type of element currently supported are 'Peaks'.

Peaks have the following properties:

| Name   | Type   | Description                                                 |
|--------|--------|-------------------------------------------------------------|
| `id` | number | the ID of the peak. |
| `version` | number | the version of the peak. |
| `source_id` | string | the source of the peak. |
| `creation_time` | Date | when the peak has been inserted in the db. |
| `lat` | number | latitude. |
| `lon` | number | longitude. |
| `elevation` | number | elevation of the peak. |
| `name` | string | name of the peak. |
| `wikidata_id` | string | Wikidata ID representing the peak. |
| `wikipedia_link` | string | Wikipedia link of the peak in the format "language:title". |
| `source_type` | string | type of the external source from which the peak come from. Can be `cgn`, `ct10`, `osm`, `geonames`, `custom`. |
| `cgn_toponymic_id` | string | ID from the Canadian Geographical Names db (`source_type` = `cgn`). |
| `ct10_cod_ele` | string | ID from the Lombardy land register CT10 (`source_type` = `ct10`). |
| `osm_id` | string | ID from OpenStreetMap (`source_type` = `osm`). |
| `osm_version` | string | the version of the peak from OpenStreetMap (`source_type` = `osm`). |
| `geoname_id` | number | ID from GeoNames (`source_type` = `geonames`). |
| `geoname_mtime` | Date | the last modified time from GeoNames (`source_type` = `geonames`). |
| `custom_id` | string | the ID of a peak internally used (`source_type` = `custom`). |

## List sources
`GET /sources`

List all available sources of peaks.

Permission required: none

Response statuses: 200, 500

### Example:
```
> GET /sources
>
< HTTP\1.1 200 OK
< Content-Type: application/json
<
[
	{
		"id": "CGN",
		"description": "Canadian Geographical Names",
		"type": "public"
	},
	{
		"id": "OpenStreetMap",
		"description": "OpenStreetMap collaborative map of the world",
		"type": "public"
	},
	{
		"id": "2018-09-20T15:46 N46E009",
		"description": "DEM1 extracted peaks from N46E009 compared against 'SwitzerlandGroundTruth'",
		"type": "dem_extracted"
	}
]
```

## Get source info
`POST /sources/:id/info`

Returns informations about the source:
- `num_peaks`: number of peaks in the source.
- `bbox`: bounding box of all the peaks in the source, format is: 'minLon,minLat,maxLon,maxLat'.
- `sample_peaks`: 100 random peaks from the source, returned if the `area` parameter is specified and if it is less then 30.000 km^2.

**Note:** this function is using POST instead of GET because the parameter area can be very large (>100k) and must be sent as part of the body of the HTTP request. Some browsers do not allow AJAX GET requests with a body set.

Permission required: none

Response statuses: 200, 500

### Parameters

| Name | Type   | Description                                      |
|------|--------|--------------------------------------------------|
| area | string | Polygon in the format "lng1,lat1,...,lngX,latX". |

### Example:
```
> POST /sources/OpenStreetMap/info
>
< HTTP\1.1 200 OK
< Content-Type: application/json
<
{
	"id": "OpenStreetMap",
	"description": "OpenStreetMap collaborative map of the world",
	"type": "public",
	"num_peaks": "533550",
	"bbox":"-179.8806635,-85.3475888,179.9872917,85.0511393",
	"sample_peaks": [
		{
			"id": 8383033,
			"version": 0,
			"lon": 20.1735625,
			"lat": 49.2036071,
			"name": "Malá Ľadová veža"
		},
		{
			"id": 8435136,
			"version": 0,
			"lon": 133.5957631,
			"lat": 34.243653,
			"name": "紫雲出山 (Mt.Shiude)"
		}
	]
}
```

## Delete source
`DELETE /sources/:id`

Delete a source of peaks.

Permission required: `upload_peaks`

Response statuses: 204, 400, 500

### Example:
```
> DELETE /sources/2018-09-20T15:46+N46E009
> Authorization: uzh1v2xifuzh1v2xif4fmqnp9uftv4
>
< HTTP\1.1 204 OK
<
```

## Get source peaks
`GET /sources/:id/peaks`

Returns the peaks of the specified source:
- `peaks`: array of peaks (limited to 10.000).
- `ground_truth_peaks`: peaks from the ground truth, returned only if the source type is "dem_extracted".
- `similar_peaks_links`: object linking the IDs of the peaks to the IDs of the similar_peaks and vice versa, returned only if the source type is "dem_extracted".

Permission required: none

Response statuses: 200, 400, 500

### Example:
```
> GET /sources/2018-09-20T15:46+N46E009
>
< HTTP\1.1 200 OK
< Content-Type: application/json
<
{
	"peaks": [
		{
			"id": 92357677,
			"version": 0,
			"source_id": "2018-09-20T15:46 N46E009",
			"lon": 9.7736,
			"lat": 46.48111111111111,
			"source_type": "custom",
			"custom_id": "418"
		}
	],
	"ground_truth_peaks": [
		{
			"id": 91568285,
			"version": 0,
			"source_id": "SwitzerlandGroundTruth",
            "lat": 46.48109985861885,
            "lon": 9.773603256222634,
			"name": "Piz Albana",
			"source_type": "custom",
			"custom_id": "{1E215B30-67BB-4C1B-8BF2-33A0BC485CF2}"
		}
	],
	"similar_peaks_links": {
		92357677: 91568285,
		91568285: 92357677
	}
}
```

## Create new source of peaks
`POST /sources`

Creates a new source of peaks.

Permission required: `upload_peaks`

Response statuses: 201, 400, 401, 403, 409, 500

### Parameters

| Name        | Type   | Description                                      |
|-------------|--------|--------------------------------------------------|
| id          | string | **Required.** Source ID.                         |
| description | string | **Required.** Source description.                |
| peaks       | File   | **Required.** JSON file containing the peaks.    |

### Format of the peaks file:
```
[
	{
		"id": "a1",
		"lat": 0,
		"lon": 0
	},
	{
		"id": "b2",
		"lat": 0.11,
		"lon": -0.22,
		"elevation": 1234
	},
	{
		"id": "c3",
		"lat": -1,
		"lon": 1,
		"elevation": 1234,
		"name": "aaa"
	}
]
```

### Example:
```
> POST /sources
> Authorization: uzh1v2xifuzh1v2xif4fmqnp9uftv4
> Content-Type: multipart/form-data
>
...

< HTTP\1.1 201 OK
< Content-Type: application/json
<
{
	"id": "MySpecialPeaks",
	"description": "Peaks from XYZ",
	"type": "public",
	"num_peaks": "2",
	"bbox":"9.7736,46.481,9.8699,46.572",
	"sample_peaks": [
		{
			"id": "pk-72443
			"lon": 9.7736,
			"lat": 46.481,
			"name": "a peak"
		},
		{
			"id": "pk-72444
			"lon": 9.8699,
			"lat": 46.572,
			"name": "another peak"
		}
	]
```

## Create new source of DEM extracted peaks
`POST /sources/dem_extacted`

Create a new source of DEM extracted peaks. This function uses the `multipart/form-data` encoding.

Permission required: `upload_peaks`

Response statuses: 201, 400, 401, 403, 500

### Parameters

| Name         | Type             | Description                        |
|--------------|------------------|------------------------------------|
| description  | text/plain       | Description of the source.         |
| tp           | application/json | True positive peaks.               |
| fp           | application/json | False positive peaks.              |
| groups       | application/json | Area groups of the true positives. |
| ground_truth | text/plain       | Source ID to use as ground truth.  |
| dem_type     | text/plain       | DEM detail level, can be 1 or 3.   |
| is_resized   | boolean          | Wheter the DEM has been resized.   |

## Update a source of peaks
`PATCH /sources/:id`

Change the properties of a source.

Permission required: `upload_peaks`

Response statuses: 200, 400, 401, 403, 409, 500

### Example:
```
> PATCH /sources/2018-09-20T15:46+N46E009
> Authorization: uzh1v2xifuzh1v2xif4fmqnp9uftv4
> Content-Type: application/json
>
{
	"id": "2018-09-20T15:46 N46E009 old",
	"description": "Created using the old dataset"
}

< HTTP\1.1 200 OK
< Content-Type: application/json
<
{
	"id": "2018-09-20T15:46 N46E009 old",
	"description": "Created using the old dataset"
}
```