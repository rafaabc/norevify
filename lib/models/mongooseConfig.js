'use strict';

const mongoose = require('mongoose');

// Mongoose runs schema validators (min, enum, maxlength, ...) on create/save only; update
// queries (findByIdAndUpdate, updateOne, findOneAndUpdate) skip them unless runValidators
// is set. Turn it on globally so the schema constraints hold on every write path, not just
// inserts. Required by every model file so it applies before any query runs — including
// under the unit/integration suites, which load models without lib/db.mjs.
mongoose.set('runValidators', true);

module.exports = mongoose;
