const express = require('express');
const path = require('path');

const app = express();
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));

const PORT = process.env.PORT || 4200;
app.listen(PORT, () => {
  console.log(`Site running at http://localhost:${PORT}`);
});
