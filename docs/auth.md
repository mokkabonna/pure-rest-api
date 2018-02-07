# Authentication and authorization

For authentication with a tbd rest api a recommended approach is to use server to server authentication. This can also be called resource to resource communication.

This allows for the provider of the service (A) to later contact the client (B). This is useful if the service A want something in return or need to communicate important information to the client.

## First time

The flow is as the following for the first time communication where the client B knows that the service A has no prior knowledge of the client B. But it knows nothing of the server and the authentication method it uses.


1. The client B requests a protected resource from the service A
2. The service A returns 401 unanthenticated with a WWW-authenticate header of `shared-secret`
3. The client B constructs a secret token that it associates with the service A
4. The client B sends this token in the authentication header
5. The client B also sends A X-resource-url header with a url to the resource (computer or human or other) that requests the information
6. The service A, now acting as a https client requests the url provided by the client B
7. Client B now acting as a service provides a link to a collection of resources with the relation name "secrets"
8. The client A does a POST request to the url target that was provided by the link relation "secrets". Client A sends a secret token to the service B
9. The client B have now received the secret and can construct a correct authentication header with the value "B-secret:A-secret" base 64 encoded.



## Link relation

Relationship name: secrets
