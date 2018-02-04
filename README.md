# API Workflows

GET
- No creation (except for dynamic replies to resources that exists)
- No augmentation
- No input transformation of the resource itself
- No side effects
- Safe


PUT
- No augmentation or transformation of the input
- Can create, MUST return 201 then
- Can be called repeatedly safely


DELETE
- Deletes the resource
- Can be called repeatedly safely

Authenticate
Authorize
Cache
Validate parameters?



## authorization

GET /users

=> GET /users
=> GET /users.auth




## Routing

A request comes in:
GET localhost:8080/users

GET /flow

=> Cache GET localhost:8081/users
=> Auth GET localhost:8082/users
=> Persist (origin server) GET localhost:8083/users




Creating a new resource in a collection:
cache
auth
validation
persist
augmentation/processing/creation (only for POST)


Getting a singular resource
cache
auth
validation
persist


Deleting a resource
cache
auth
(validation, probably not)
persist
