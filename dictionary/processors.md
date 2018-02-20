# Processors

Processors are entities that moves the state of the io object forward in some fashion. This could be enrichment, composition, validation, authorization etc.

Processors can further be divided into the following:

## Processing/Operator agent

An operator agent is code that receives processing requests and prepares the io object for the process operator depending on the capabilities of the operator.

When the operator is code, a dynamic io representation could be constructed from the io object and presented to the operating code.

## Process operator

A process operator is any entity that supports operating on a representation of the io object. This may be some code that automatically perform a task, or it may be a real-world entity. Most commonly a human, but not exclusively limited to humans.

When the operator is a human, the process agent will typically present the input in a fashion that the operator understands. Typically this is rendered HTML, with javascript that enables a rich interaction to take place.
