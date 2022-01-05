# Feedback

Functions to handle the feedback of the users.

## Send a text feedback
`POST /feedback`

Parameters:

| Name   | Type     | Description                             |
|--------|----------|-----------------------------------------|
| `text` | `string` | **Required**. The text of the feedback. |

Permission required: none.

Response statuses: 204, 400, 500
