const bcrypt = require('bcryptjs');

const password = 'contraseña'; 

const hash = bcrypt.hashSync(password, 10);
console.log(hash);


// © Github davidgb.05