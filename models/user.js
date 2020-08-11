'use strict'
const mongoose = require('mongoose');
const Schema = mongoose.Schema; 

let schema = Schema(
  {
    name: String,
    email: String,
    password: String,
  },
  { collection: 'users' }
);

module.exports = mongoose.model('User', schema);