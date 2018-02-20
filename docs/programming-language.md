This describes the building blocks of the js-pseudo language.



Normal:
```js
var result = (5 + io.i * 7) * 9
io.o = result
// => 171
```

new (notice how multiplication is not grouped when separate statements)
```js
take io.i // 2
* 7 // 14
+ 5 // 19
* 9 // 171
set io.o
```