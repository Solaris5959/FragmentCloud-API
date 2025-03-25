# Non-Existent Endpoint Test
GET http://localhost:8080/nonexistent

# We should get back an HTTP 1.1 404 response
HTTP/1.1 404

# Extra checks to perform against the response
[Asserts]
# Optional: If the 404 response returns a specific content type, you can check it.
# e.g., if it returns JSON with an error message:
# header Content-Type == "application/json"
# jsonpath "$.error" exists
# jsonpath "$.message" isString
