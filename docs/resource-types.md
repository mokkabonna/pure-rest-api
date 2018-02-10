# Types of REST resources

A resource is a resource in the classical term.

But there are different types of resources that have special properties and semantics. when using the term resource I mean any of the other resource types.


- origin
- sub
- composite


## Relations

- item: Traditional item relation, typically is identified through the path
- collection: The reverse of item
- via: The target is a source resource
- up: The parent resource


## Origin resources

These are resources that MUST have no overlap with other origin resources. They can have the same data, but they cannot source that data from each other or a shared resource. So updating a origin resource never updates anything in another origin resource. This is idempotency.

## Sub resources

Sub resources are resources that are inside other resources. They cannot go outside that resource, meaning they can only have one parent. They also have no data of their own. They are purely a product of another resource. Sub resources can overlap with other sub resources of the same parent (sibling).

Doing a idempotent unsafe action on a sub resource affects all ancestor resources as well as all sibling resources. (other sub resources)

All resources can be sub resources. (except the root resource)


## Parent resources

All resources can be parent resources. It is a parent if it has minimum one sub resource.


## Collection resources

Collection resources are resources that consists of other resources. They can also have data of their own. (can they? or are collection resources purely a product of items?) They might partially expose a subset representation of each item in the collection.

## Composite resources

Composite resources are resources that compose other resources fully or partially to a new resource. They might also hold their own data. This is similar to collection resources, but collection resources have special semantic meaning.

## Source resources

Source resources are resources that are part of a collection resource or a composite resource.


## Effects of unsafe methods

Unsafe methods changes the target resource and forces all parent resources to be invalidated. On the next request to the parent resources, they need to refetch all source resources and reevaluate.
