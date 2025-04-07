# 1. Create initial JSON fragment
POST http://localhost:8080/v1/fragments
Content-Type: application/json
[BasicAuth]
user1@email.com:password1
{
  "service": "DynamoDB"
}

# 2. Fragment created with 201
HTTP/1.1 201
[Captures]
fragment1_url: header "Location"
fragment1_id: jsonpath "$.fragment.id"

# 3. Get the above posted fragments info to verify
GET {{fragment1_url}}/info
[BasicAuth]
user1@email.com:password1

HTTP 200
[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragment.id" matches /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/
jsonpath "$.fragment.ownerId" matches /^[0-9a-fA-F]+$/
jsonpath "$.fragment.created" isString
jsonpath "$.fragment.updated" isString
jsonpath "$.fragment.type" == "application/json"
jsonpath "$.fragment.size" == 25

# 4. Create secondary Markdown fragment
POST http://localhost:8080/v1/fragments
Content-Type: text/markdown
[BasicAuth]
user1@email.com:password1
`DynamoDB provides **excellent** performance.`

# 5. Second Fragment created with 201
HTTP/1.1 201
[Captures]
fragment2_url: header "Location"
fragment2_id: jsonpath "$.fragment.id"

# 6. Get the second posted fragments info to verify
GET {{fragment2_url}}/info
[BasicAuth]
user1@email.com:password1

HTTP 200
[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragment.id" matches /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/
jsonpath "$.fragment.ownerId" matches /^[0-9a-fA-F]+$/
jsonpath "$.fragment.created" isString
jsonpath "$.fragment.updated" isString
jsonpath "$.fragment.type" == "text/markdown"

# 7. Retrieve all fragment ids for user to verify posted fragments exist
GET http://localhost:8080/v1/fragments
[BasicAuth]
user1@email.com:password1

HTTP/1.1 200
[Asserts]
jsonpath "$.fragments" isCollection
jsonpath "$.fragments" includes {{fragment1_id}}
jsonpath "$.fragments" includes {{fragment2_id}}

# 8. Delete first fragment
DELETE {{fragment1_url}}
[BasicAuth]
user1@email.com:password1

HTTP/1.1 200

# 10. Attempt to get the above deleted fragment
GET {{fragment1_url}}
[BasicAuth]
user1@email.com:password1

# 11. Fragment not found as it was deleted
HTTP/1.1 404

# 12. Get all fragment ids for user to verify only second fragment exists
GET http://localhost:8080/v1/fragments
[BasicAuth]
user1@email.com:password1

HTTP 200
[Asserts]
jsonpath "$.fragments" not includes {{fragment1_id}}
jsonpath "$.fragments" includes {{fragment2_id}}
