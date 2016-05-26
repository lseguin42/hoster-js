Hoster-Js
=========

# install
```shell
npm install hoster-js --save
```

# usage
```typescript
import { Uptobox } from 'hoster-js';
import fs = require('vinyl-fs');

let uptobox = new Uptobox('username', 'password');

uptobox.info('http://uptobox.com/your_link')
  .then((data) => {
      // data.filename;
      // data.size;
      // ...
  });
  
uptobox.download('http://uptobox.com/your_link')
  .pipe(fs.dest('downloads'));

```
