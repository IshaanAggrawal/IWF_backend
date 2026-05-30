import express from "express";
import paymentRoutes from "./src/routes/payment.routes.js";
import 'dotenv/config'; // Load environment variables

const app = express();

app.use(express.json()); // For parsing application/json

app.get('/', (req, res) => {
    res.send('Hello World! Your Express server is running.');
});

app.use('/api/payment', paymentRoutes);

app.listen(3000, () => {
    console.log("Server is running on http://localhost:3000");
});
