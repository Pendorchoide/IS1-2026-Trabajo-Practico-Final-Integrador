import { Router } from "express";
import { ClienteController } from "../controller/clienteController.js"

export const clienteRouter = Router();

clienteRouter.get('/:id', ClienteController.getClienteById);
clienteRouter.post('/login', ClienteController.loginCliente);
clienteRouter.post('/register', ClienteController.registerCliente);
clienteRouter.patch('/change-password', ClienteController.changePassword);
clienteRouter.put('/:id', ClienteController.updateClienteById);