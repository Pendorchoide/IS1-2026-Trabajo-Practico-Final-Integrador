import { Router } from "express";
import { docClient } from "../aws.js";
import { TicketController } from "../controller/ticketController.js";

import crypto from 'crypto';

export const ticketRouter = Router();

ticketRouter.get('/resumenTickets', TicketController.getClientTickets);









// ============= EL FAMOSO LEGACY =============
ticketRouter.post('/api/getTicket', (req,res) => {
    const {id}  = req.body;
 
    if (!id) {
        res.status(400).send({response : "ERROR" , message: "ticket id no informada"});
        return;
    }
    var params = {
        TableName: "ticket",
        Key: {
            "id" : id
            //"clienteID": "0533a95d-7eef-4c6b-b753-1a41c9d1fbd0"   
            //"id"       : "e08905a8-4aab-45bf-9948-4ba2b8602ced"
        }
    };
    docClient.get(params, function (err, data) {
        if (err) {
            res.status(400).send(JSON.stringify({response : "ERROR", message : "DB access error "+err}));
        }
        else {
            if (Object.keys(data).length == 0) {
                res.status(400).send({response : "ERROR" , message : "ticket invalido"});
            } else {
                res.status(200).send(JSON.stringify({response : "OK", "data" : data}));    
            }    
        }
    })
});

/*-----------------
/api/addTicket
API REST para agregar ticket (genera id)
*/
ticketRouter.post('/api/addTicket', (req,res) => {

    const {clienteID} = req.body;
    const estado_solucion = 1;
    const {solucion} = req.body;
    const {descripcion} = req.body;

    var hoy = new Date();
    var dd = String(hoy.getDate()).padStart(2, '0');
    var mm = String(hoy.getMonth() + 1).padStart(2, '0'); //January is 0!
    var yyyy = hoy.getFullYear();
    hoy = dd + '/' + mm + '/' + yyyy;

    const newTicket = {
     id                    : crypto.randomUUID(),
     clienteID             : clienteID,
     estado_solucion       : estado_solucion,
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

    docClient.put(paramsPut, function (err, data) {
        if (err) {
            res.status(400).send(JSON.stringify({response : "ERROR", message : "DB error" + err}));
        } else {
            res.status(200).send(JSON.stringify({response : "OK", "ticket": newTicket}));
        }
    });
}
)

/*--------
/api/updateTicket
Dado un id actualiza el ticket, debe informarse la totalidad del ticket excepto ultimo_contacto
*/
ticketRouter.post('/api/updateTicket', (req,res) => {

    const {id} = req.body;
    const {clienteID} = req.body;
    const {estado_solucion} = req.body;
    const {solucion} = req.body;
    const {descripcion} = req.body;
    const {fecha_apertura} = req.body;

    if (!id) {
        res.status(400).send({response : "ERROR" , message: "Id no informada"});
        return;
    }

    if (!clienteID) {
        res.status(400).send({response : "ERROR" , message: "clienteID no informada"});
        return;
    }

    if (!estado_solucion) {
        res.status(400).send({response : "ERROR" , message: "estado_solucion no informada"});
        return;
    }

    if (!solucion) {
        res.status(400).send({response : "ERROR" , message: "solucion no informado"});
        return;
    }

    if (!fecha_apertura) {
        res.status(400).send({response : "ERROR" , message: "fecha apertura"});
        return;
    }
    
    var hoy = new Date();
    var dd = String(hoy.getDate()).padStart(2, '0');
    var mm = String(hoy.getMonth() + 1).padStart(2, '0'); //January is 0!
    var yyyy = hoy.getFullYear();
    hoy = dd + '/' + mm + '/' + yyyy;

    const ultimo_contacto = hoy;

    var params = {
        TableName: "ticket",
        Key: {
            "id" : id
            //test use "id": "0533a95d-7eef-4c6b-b753-1a41c9d1fbd0"   
             }
        };
        
    docClient.get(params, function (err, data) {
        if (err)  {
            res.status(400).send(JSON.stringify({response : "ERROR", message : "DB access error "+ null}));
            return;
        } else {

            if (Object.keys(data).length == 0) {
                res.status(400).send(JSON.stringify({"response":"ERROR",message : "ticket no existe"}),null,2);
                return;
            } else {

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
                   Key: { 
                       "id": id 
                   }, 
                   ReturnValues: "ALL_NEW", 
                   TableName: "ticket", 
                   UpdateExpression: "SET #c = :c, #e = :e, #a = :a, #s = :s, #d = :d, #u = :u" 
                };
                docClient.update(paramsUpdate, function (err, data) {
                    if (err)  {
                        res.status(400).send(JSON.stringify({response : "ERROR", message : "DB access error "+err}));
                        return;
                    } else {
                        res.status(200).send(JSON.stringify({response : "OK",  "data": data}));
                    }    
                });    
            }
        }    
    })

});