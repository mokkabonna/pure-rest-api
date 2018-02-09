# Processing of requests

For POST requests (possibly others) we need to process incoming data and do things like generate ids, generate read only fields etc.

The code that does this processing is called user code. In that it operates on another level than normal code in the system itself.

The user code will therefore have limited access to actions.

The user code can do its own requests based on a customized http client given to it along with the representation embodied in the request.

The request done to the user code is determined by content negotiation. For javascript code it is application/javascript.

For other processing (like processing by a human) the content type might be plain/text, text/commonmark, text/html, even image/* 

The request body should contain all information that is needed to make a the processing possible. Keep in mind that the URL does locate/identify the resource that is responsible for processing the request.

So for a human it might be /martin/programming/knockout.js

And a request body might contain consist of a html representation together with code samples, links to documentation, a question, contain a submit form for the answer etc.



