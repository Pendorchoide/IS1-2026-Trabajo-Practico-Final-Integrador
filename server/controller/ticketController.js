import { docClient } from "../aws.js";
import { validateCredentials } from "../utils/utils.js";

export class TicketController {

    static getClientTickets = (req, res) => {

        if (!req.query.userId) {
            res.status(404).json({ status: "ERROR", message: "Se requiere USER_ID PARAM." });
            return;
        }

        if (!req.query.userPassword) {
            res.status(404).json({ status: "ERROR", message: "Se requiere USER_PASSWORD PARAM." });
            return;
        }

        const { userId, userPassword, ticketId } = req.query;

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
                            cliente: {
                                id: cliente.id,
                                contacto: cliente.contacto,
                                nombre: cliente.nombre
                            },
                            tickets: {
                                count: dataTickets.Items.length,
                                data: dataTickets.Items.map((t) => ({
                                    id: t.id,
                                    fecha_apertura: t.fecha_apertura,
                                    estado_solucion: t.estado_solucion
                                }))
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
                        cliente: {
                            id: cliente.id,
                            contacto: cliente.contacto,
                            nombre: cliente.nombre
                        },
                        ticket: ticketEncontrado
                    });   
                };
    
                docClient.scan(paramsTickets, callbackTickets);
            };
        
            docClient.get(paramsCliente, callbackCliente);
        });
    } 
}
