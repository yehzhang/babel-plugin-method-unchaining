# babel-plugin-method-unchaining
> Transforms method chaining to sequence of expressions.

## Example
**In**
```javascript
var result = Class.newBuilder().build();
```

**Out**
```javascript
var _a;

var result = (_a = Class.newBuilder(), _a.build)();
_a = undefined;
```

## Installation
```sh
npm install babel-plugin-method-unchaining
```

## Usage
### Via `.babelrc`

**.babelrc**

```json
{
  "plugins": ["babel-plugin-method-unchaining"]
}
```

### Via CLI

```sh
babel --plugins babel-plugin-method-unchaining script.js
```

### Via Node API

```javascript
require("babel-core").transform("code", {
  plugins: ["babel-plugin-method-unchaining"]
});
```
