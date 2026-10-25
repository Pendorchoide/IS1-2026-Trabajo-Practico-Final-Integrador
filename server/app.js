import express from 'express';
import cors from 'cors';

const PORT = 8080;

import { clienteRouter } from './routes/clienteRouter.js';
import { ticketRouter } from './routes/ticketRouter.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());


app.get('/health', (_, res) => {
    res.status(200).json({ status : "OK", message : "API Ready" });
});

app.use("/clientes", clienteRouter);
app.use("/tickets", ticketRouter);

app.listen(PORT, () => {
    console.log(`Server running on port: ${PORT}`);
});