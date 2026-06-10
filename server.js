const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'public', 'data.json');

// Get password from environment variable or use the default
const APP_PASSWORD = process.env.PASSWORD || 'PC6qZrtQC*C';

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to check password header
function authMiddleware(req, res, next) {
  const passwordHeader = req.headers['x-password'];
  if (passwordHeader === APP_PASSWORD) {
    next();
  } else {
    res.status(401).json({ error: 'Ongeldig wachtwoord' });
  }
}

// Check password endpoint
app.post('/api/login', (req, res) => {
  const { password } = req.body;
  if (password === APP_PASSWORD) {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, error: 'Ongeldig wachtwoord' });
  }
});

// Get data endpoint
app.get('/api/data', authMiddleware, (req, res) => {
  fs.readFile(DATA_FILE, 'utf8', (err, data) => {
    if (err) {
      // If file doesn't exist, create an empty data structure
      if (err.code === 'ENOENT') {
        const initialData = { categories: [], links: [] };
        fs.writeFile(DATA_FILE, JSON.stringify(initialData, null, 2), () => {
          return res.json(initialData);
        });
      } else {
        return res.status(500).json({ error: 'Kan data niet lezen' });
      }
    } else {
      try {
        const jsonData = JSON.parse(data);
        res.json(jsonData);
      } catch (parseErr) {
        res.status(500).json({ error: 'Ongeldig dataformaat' });
      }
    }
  });
});

// Save data endpoint
app.post('/api/data', authMiddleware, (req, res) => {
  const data = req.body;
  data.lastUpdated = Date.now();
  fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf8', (err) => {
    if (err) {
      return res.status(500).json({ error: 'Kan data niet opslaan' });
    }
    res.json({ success: true });
  });
});

app.listen(PORT, () => {
  console.log(`Server draait op http://localhost:${PORT}`);
  console.log(`Standaard wachtwoord is: ${APP_PASSWORD}`);
});
