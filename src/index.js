const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const doctorRoutes = require('./routes/doctor.routes');
const tokenRoutes = require('./routes/token.routes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// Routes
app.use('/api/doctors', doctorRoutes);
app.use('/api/tokens', tokenRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'UP', timestamp: new Date() });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app; // For testing/simulation if needed
