
const provider = process.env.PROVIDER || 'mock';
if (provider === 'carquery') module.exports = require('./carquery');
else if (provider === 'multi') module.exports = require('./multi');
else if (provider === 'jato') module.exports = require('./jato');
else if (provider === 'autovista') module.exports = require('./autovista');
else if (provider === 'eurotax') module.exports = require('./eurotax');
else module.exports = require('./mock');
