import crypto from 'crypto';
import { docClient } from "../aws.js";
import { validateCredentials } from "../utils/utils.js";
import { toTicketDTO, toTicketResumenDTO } from "../utils/dto.js";

export class TicketController {

    static createTicket = (req, res) => {
        const { clienteID, solucion, descripcion } = req.body;

        if (!clienteID) {
            res.status(400).json({ status: "ERROR", message: "Se requiere CLIENTE_ID." });
            return;
        }

        if (!solucion) {
            res.status(400).json({ status: "ERROR", message: "Se requiere SOLUCION." });
            return;
        }

        if (!descripcion) {
            res.status(400).json({ status: "ERROR", message: "Se requiere DESCRIPCION." });
            return;
        }

        const ESTADO_INIT = 1;

        const hoy = new Date().toISOString();

        const newTicket = {
            id                    : crypto.randomUUID(),
            clienteID             : clienteID,
            estado_solucion       : ESTADO_INIT,
            solucion              : solucion,
            descripcion           : descripcion,
            fecha_apertura        : hoy,
            ultimo_contacto       : hoy
        };

        const paramsPut = {
            TableName: "ticket",
            Item: newTicket,
            ConditionExpression:'attribute_not_exists(id)',
        };

        const callback = (err, _) => {
            if (err) {
                res.status(400).json({ status: "ERROR", message : "DB error." });
                return;
            }

            res.status(200).json({ status: "OK", data: { ticket: toTicketDTO(newTicket) } });
        }

        docClient.put(paramsPut, callback);
    }

    static getTicketById = (req, res) => {
        const { id }  = req.params;
     
        if (!id) {
            res.status(400).json({ status: "ERROR", message: "Se requiere ID de Ticket"});
            return;
        }

        const params = {
            TableName: "ticket",
            Key: { id }
        };

        const callback = (err, data) => {
            if (err) {
                res.status(400).json({ status: "ERROR", message : "DB access error." });
                return;
            }

            if (!data.Item) {
                res.status(400).json({ status: "ERROR", message : "Ticket Invalido." });
                return;
            }

            res.status(200).json({ status: "OK", data: { ticket: toTicketDTO(data.Item) } });    
        }

        docClient.get(params, callback); 
    }

    static getClientTickets = (req, res) => {
        const { userId, userPassword, ticketId } = req.query;

        if (!userId) {
            res.status(404).json({ status: "ERROR", message: "Se requiere USER_ID PARAM." });
            return;
        }

        if (!userPassword) {
            res.status(404).json({ status: "ERROR", message: "Se requiere USER_PASSWORD PARAM." });
            return;
        }

        /* 1. Verificar que el cliente existe y sus credenciales son válidas */ 
        validateCredentials(userId, userPassword, (isValid) => {
            if (!isValid) {
                res.status(404).json({ status: "ERROR", message: "Credenciales Invalidas." });
                return;
            }
    
            const paramsCliente = {
                TableName: "cliente",
                Key: { "id": userId }
            };
        
            const callbackCliente = (err, dataCliente) => {
                if (err || !dataCliente || !dataCliente.Item) {
                    res.status(500).json({ status: "ERROR", message: "Error al obtener datos del cliente." });
                    return;
                }
                
                const cliente = {
                    activo                : dataCliente.Item.activo,
                    baja                  : dataCliente.Item.baja,
                    contacto              : dataCliente.Item.contacto,
                    fecha_alta            : dataCliente.Item.fecha_alta,
                    fecha_cambio_password : dataCliente.Item.fecha_cambio_password,
                    fecha_ultimo_ingreso  : dataCliente.Item.fecha_ultimo_ingreso,
                    id                    : dataCliente.Item.id,
                    nombre                : dataCliente.Item.nombre,
                    primer_ingreso        : dataCliente.Item.primer_ingreso,
                    registrado            : dataCliente.Item.registrado
                };
    
                const paramsTickets = { 
                    TableName: "ticket",
                    FilterExpression : 'clienteID = :clienteID',
                    ExpressionAttributeValues : { ':clienteID' : userId }
                };      
    
                const callbackTickets = (err, dataTickets) => {
                    if (err) {
                        res.status(500).json({ status: "ERROR", message: "DB Access Error al buscar tickets" });
                        return;
                    }

                    if (!ticketId) {
                        return res.status(200).json({
                            status: "OK",
                            data: {
                                cliente: {
                                    id: cliente.id,
                                    contacto: cliente.contacto,
                                    nombre: cliente.nombre
                                },
                                tickets: dataTickets.Items.map((t) => toTicketResumenDTO(t)),
                                count: dataTickets.Items.length
                            }
                        });    
                    }
                    
                    const ticketEncontrado = dataTickets.Items.find((t) => t.id === ticketId);

                    if (!ticketEncontrado) {
                         return res.status(404).json({ 
                             status: "ERROR", 
                             message: "Ticket INVALID." 
                         });
                    }

                   
                    return res.status(200).json({
                        status: "OK",
                        data: {
                            cliente: {
                                id: cliente.id,
                                contacto: cliente.contacto,
                                nombre: cliente.nombre
                            },
                            ticket: toTicketDTO(ticketEncontrado)
                        }
                    });    
                };
    
                docClient.scan(paramsTickets, callbackTickets);
            };
        
            docClient.get(paramsCliente, callbackCliente);
        });
    }

    static updateTicket = (req, res) => {
        const { id } = req.params;        
        const { clienteID, estado_solucion, solucion,descripcion, fecha_apertura } = req.body;

        if (!id) {
            res.status(400).json({ status: "ERROR", message: "Se requiere TICKET_ID." });
            return;
        }

        if (!clienteID) {
            res.status(400).json({ status: "ERROR", message: "clienteID no informada" });
            return;
        }

        if (!estado_solucion) {
            res.status(400).json({ status: "ERROR", message: "estado_solucion no informada" });
            return;
        }

        if (!solucion) {
            res.status(400).json({ status: "ERROR", message: "solucion no informado" });
            return;
        }

        if (!fecha_apertura) {
            res.status(400).json({ status: "ERROR", message: "fecha apertura" });
            return;
        }
        
        const hoy = new Date().toISOString();
        const ultimo_contacto = hoy;

        var params = {
            TableName: "ticket",
            Key: { id }
        }

        const callback = (err, data) => {
            if (err)  {
                res.status(400).json({ status: "ERROR", message : "DB access error." });
                return;
            } 
            
            if (Object.keys(data).length == 0) {
                res.status(400).json({"response":"ERROR",message : "Ticket Invalido" });
                return;
            }

            const paramsUpdate = { 
                ExpressionAttributeNames: { 
                    "#c": "clienteID", 
                    "#e": "estado_solucion",
                    "#s": "solucion",
                    "#a": "fecha_apertura",
                    "#u": "ultimo_contacto",
                    "#d": "descripcion"
                },
                ExpressionAttributeValues: { 
                    ":c":  clienteID, 
                    ":e":  estado_solucion , 
                    ":s":  solucion , 
                    ":a":  fecha_apertura,
                    ":u":  ultimo_contacto,
                    ":d":  descripcion 
                },
                Key: { id },
                ReturnValues: "ALL_NEW",
                TableName: "ticket",
                UpdateExpression: "SET #c = :c, #e = :e, #a = :a, #s = :s, #d = :d, #u = :u"
            };

            docClient.update(paramsUpdate, (err, dataUpdate) => {
                if (err)  {
                    res.status(400).json({ status: "ERROR", message : "DB access error." });
                    return;
                }

                return res.status(200).json({ status: "OK", data: { ticket: toTicketDTO(dataUpdate.Attributes) } });
            })
        }
            
        docClient.get(params, callback);
    }
}