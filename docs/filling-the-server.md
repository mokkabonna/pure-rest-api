# Creating the server

When you first navigate to the server there are no resources. So a get to the server returns a 404.


```text
GET /
------
404
Content-type: text/html

Welcome to the pure rest server. You have not setup the server yet.

It is strongly recommended that you use a predefined recipe. To do that you need to do a POST request to / with a URL that points to the recipe that you desire to use.

You can find some recipes at http://martinhansen.com among others.

```

```text
POST /
Allow: OPTIONS, POST
Content-type: text/html
```
