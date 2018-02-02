# API Workflows

GET
No creation (except for dynamic replies to resources that exists)
No augmentation
No input transformation of the resource itself
No side effects
Safe


PUT
No augmentation or transformation of the input
Can create, MUST return 201 then
Can be called repeatedly safely


DELETE
Deletes the resource
Can be called repeatedly safely

Authenticate
Authorize
Cache
Validate parameters?





GET /users
