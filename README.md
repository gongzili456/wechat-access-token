# wechat-access-token
pop one wechat access token sometimes refresh

# Install
`npm install wx-access-token`

# Usage
```
var token = require("wx-access-token");

token(appid, secret, function(err, t) {
  console.log(t);
})
```
