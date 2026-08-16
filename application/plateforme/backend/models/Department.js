const mongoose = require('mongoose');

const positionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Le titre du poste est requis'],
    trim: true
  },
  code: {
    type: String,
    trim: true,
    uppercase: true
  },
  description: {
    type: String,
    trim: true
  }
}, { timestamps: true });

const departmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Le nom du département est requis'],
    unique: true,
    trim: true
  },
  code: {
    type: String,
    required: [true, 'Le code du département est requis'],
    unique: true,
    trim: true,
    uppercase: true
  },
  description: {
    type: String,
    trim: true
  },
  color: {
    type: String,
    default: '#3B82F6'
  },
  positions: [positionSchema]
}, { timestamps: true });

module.exports = mongoose.model('Department', departmentSchema);
