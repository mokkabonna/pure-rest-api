# Streaming support

The process manager supports handling the multipart/form-data content type, but does so in a streaming fashion.

An incoming files are streamed to disk in a temp folder. The URI to the file is then added to the io object somewhere. The io object is then passed to the process chain as normal. If a processor needs to handle the file somehow, it can do so by getting the contents. This processing could be of any type, for example virus checking, compression of images etc.

When processing is done the file will be moved to the destination location. A 201 created can be returned with links to the created file(s) and any other resources created.