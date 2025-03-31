POST http://localhost:8080/v1/fragments
Content-Type: text/plain
[BasicAuth]
user1@email.com:password1
`S3 Integration Test`

HTTP/1.1 201
# Capture the location header
[Captures]
uri: header "Location"

# 2. Try to get the above posted fragment
GET {{uri}}
[BasicAuth]
user1@email.com:password1

HTTP/1.1 200
Content-Type: text/plain; charset=utf-8
Content-Length: 19
[Asserts]
body == "S3 Integration Test"

# 3. Delete the above posted fragment
DELETE {{uri}}
[BasicAuth]
user1@email.com:password1

HTTP/1.1 200

# 4. Try to get the above deleted fragment
GET {{uri}}
[BasicAuth]
user1@email.com:password1

HTTP/1.1 404
