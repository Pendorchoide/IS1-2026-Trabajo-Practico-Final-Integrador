import express from 'express';
import cors from 'cors';

const PORT = 8080;

import { clienteRouter } from './routes/clienteRouter.js';
import { ticketRouter } from './routes/ticketRouter.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

app.listen(
    PORT,
    () => console.log("Server running on port: ", PORT)
);

app.get('/api/health', (_, res) => {
    res.status(200).send({response : "OK", message : "API Ready"});
});

app.use("/clientes", clienteRouter);
app.use("/tickets", ticketRouter);