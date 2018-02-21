# POST

I want to either redefine POST semantics or try to eliminate the need for it completely.

The problem is that POST is unbound so posting to a resource has no telling what else it does. It might update ALL resources in the system. Meaning all proxies after receiving a post request potentially have to reevaluate all resources against the origin.

If we had dynamic resources that allowed for more granular idempotent operations then we might not need POST.

Or we could redefine it to mean that it can only affect the resource in the URL. So if you want to affect many resources, you first need to create a composite or collection resource. This can be indicated with the via link relation.
