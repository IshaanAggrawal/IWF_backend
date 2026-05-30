import express from "express";
import paymentRoutes from "./src/routes/payment.routes.js";
import uploadRoutes from "./src/routes/upload.routes.js";
import 'dotenv/config';

const app = express();

app.use(express.json());

app.get('/', (req, res) => {
    res.send('Your Express server is running.');
});

app.use('/api/payment', paymentRoutes);
app.use('/api/upload', uploadRoutes);

app.listen(3000, () => {
    console.log("Server is running on http://localhost:3000");
});
