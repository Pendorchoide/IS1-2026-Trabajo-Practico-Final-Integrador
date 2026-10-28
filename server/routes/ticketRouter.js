import { Router } from "express";
import { TicketController } from "../controller/ticketController.js";

export const ticketRouter = Router();

ticketRouter.get('/resumenTickets', TicketController.getClientTickets);
ticketRouter.get('/:id', TicketController.getTicketById);
ticketRouter.post('/', TicketController.createTicket);
ticketRouter.put('/:id', TicketController.updateTicket);