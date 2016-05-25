Hoster-Js
=========

# install
```shell
npm install hoster-js --save
```

# usage
```typescript
import { Uptobox } from 'hoster-js';

let uptobox = new Uptobox('username', 'password');

uptobox.debrid('http://uptobox.com/your_link')
  .then((data) => {
      // data.filename;
      // data.size;
      // ...
  });
```
