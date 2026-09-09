let app;
try {
  app = require('../server');
} catch (err) {
  console.error('[API Bootstrap Crash]:', err);
  const express = require('express');
  app = express();
  app.all('*', (req, res) => {
    res.status(500).json({
      error: 'CRASH_ON_BOOTSTRAP',
      message: err.message,
      stack: err.stack
    });
  });
}

module.exports = app;
