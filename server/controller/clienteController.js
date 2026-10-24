import { docClient } from "../aws.js";
import crypto from 'crypto';

export class ClienteController {

    static getClienteById = (req,res) => {
        const { id } = req.params;
       
        const params = {
            TableName: "cliente",
            Key: { id }
        };
    
        const callback = (err, data) => {
            if (err)  {
                res.status(400).send({ status: "ERROR", message: "DB access error." });
                return;
            }
    
            if (Object.keys(data).length === 0) {
                res.status(400).send({"response":"ERROR",message : "Cliente no existe."})
            }
            
            res.status(200).send({ 
                status: "OK", 
                cliente: {
                    activo                : data.Item.activo,
                    baja                  : data.Item.baja,
                    contacto              : data.Item.contacto,
                    fecha_alta            : data.Item.fecha_alta,
                    fecha_cambio_password : data.Item.fecha_cambio_password,
                    fecha_ultimo_ingreso  : data.Item.fecha_ultimo_ingreso,
                    id                    : data.Item.id,
                    nombre                : data.Item.nombre,
                    primer_ingreso        : data.Item.primer_ingreso,
                    registrado            : data.Item.registrado
                } 
                
            });
        }
    
        docClient.get(params, callback)
    }

    static loginCliente = (req, res) => {
        if (!req.body) {
            res.status(400).json({ status: "ERROR" , message: "Se requiere [CONTACTO, PASSWORD]" });
            return;
        }

        const { contacto, password } = req.body;

        // VALIDATIONS
        if (!contacto) {
            res.status(400).send({ status : "ERROR", message : "Se requiere un contacto." });
            return;
        }

        if (!password) {
            res.status(400).send({ status : "ERROR", message : "Se requiere contraseña" });
            return;
        }

        const paramsDB = {
            TableName: "cliente",
            FilterExpression: "contacto = :contactoVal",
            ExpressionAttributeValues: {
                ":contactoVal": contacto
            }
        };

        const callback = (err, data) => {
            if (err) {
                res.status(500).send({ status: "ERROR", message: "DB Access Error" });
                return;
            }

            // Al igual que query, scan devuelve un array en 'Items'
            if (!data.Items || data.Items.length === 0) {
                res.status(404).send({ status: "ERROR", message: "Cliente no encontrado" });
                return;
            }

            const cliente = data.Items[0];
            
            if (password != cliente.password) {
                res.status(400).send({ status: "ERROR", message: "Credenciales Invalidas." });
                return;
            }

            if (!cliente.activo) {
                res.status(400).send({ status: "ERROR", message: "Cliente NO Activo." });
                return;
            }

            res.status(200).send({
                status: "OK",
                id: cliente.id,
                nombre: cliente.nombre,
                contacto: cliente.contacto,
                fecha_ultimo_ingreso: cliente.fecha_ultimo_ingreso
            });    
        };

        docClient.scan(paramsDB, callback);
    }

    static registerCliente = (req, res) => {
        if (!req.body) {
            res.status(400).json({ status: "ERROR" , message: "Se requiere [CONTACTO, PASSWORD, NOMBRE]" });
            return;
        }

        const { contacto, password, nombre } = req.body;
        
        if (!password) {
            res.status(400).json({ status: "ERROR" , message: "Password no informada" });
            return;
        }

        if (!nombre) {
            res.status(400).json({ status: "ERROR", message : "Nombre no informado" });
            return;
        }

        if (!contacto){
            res.status(400).json({ status: "ERROR" , message : "Contacto no informado" });
            return;
        } 

        const paramsScan = {
            TableName: "cliente",
            FilterExpression : 'contacto = :contacto', 
            ExpressionAttributeValues : {':contacto' : contacto}
        };

        const callback = (err, data) => {
            if (err) {
                res.status(500).json({ status: "ERROR", message: "DB Access Error" });
                return;
            }

            if (Object.keys(data.Items).length != 0) {
                res.status(400).json({status: "ERROR" , message : "Cliente ya existe"});
                return;
            }

            const hoy = new Date().toISOString();

            const newCliente = {
                id                    : crypto.randomUUID(),
                contacto              : contacto,
                nombre                : nombre,
                password              : password,
                activo                : true,
                registrado            : true,
                primer_ingreso        : false,
                fecha_alta            : hoy,
                fecha_cambio_password : hoy,
                fecha_ultimo_ingreso  : hoy
            };
        
            const paramsPut = {
                TableName: "cliente",
                Item: newCliente,
                ConditionExpression: 'attribute_not_exists(id)',
            };

            docClient.put(paramsPut, function (err, dataPut) {
                if (err) {
                    res.status(400).json({ status: "ERROR", message : "DB error al insertar" });
                } else {
                    res.status(200).json({ 
                        status: "OK", 
                        "cliente": {
                            id: newCliente.id,
                            contacto: newCliente.contacto,
                            nombre: newCliente.nombre, 
                            activo: newCliente.activo,
                            registrado: newCliente.registrado,
                            primer_ingreso: newCliente.primer_ingreso,
                            fecha_alta: newCliente.fecha_alta,
                            fecha_cambio_password: newCliente.fecha_cambio_password,
                            fecha_ultimo_ingreso: newCliente.fecha_ultimo_ingreso,
                        }
                    });
                }
            });
        }

        docClient.scan(paramsScan, callback);
    }

    static changePassword = (req, res) => {
        if (!req.body) {
            res.status(400).json({ status: "ERROR" , message: "Se requiere [CONTACTO, NEW_PASSWORD]" });
            return;
        }

        const { contacto, newPassword } = req.body;


        if (!contacto) {
            res.status(400).send({status: "ERROR" , message: "Se requiere CONTACTO"});
            return;
        }

        if (!newPassword) {
            res.status(400).send({status: "ERROR" , message: "Se requiere NEW_PASSWORD"});
            return;
        }

        const paramsScan = {
                TableName: "cliente",
                FilterExpression : 'contacto = :contacto', 
                ExpressionAttributeValues : {':contacto' : contacto}
        };

        const callback = (err, data) => {
            if (err) {
                res.status(500).json({ status: "ERROR", message: "DB Access Error" });
                return;
            }

            if (Object.keys(data.Items).length === 0) {
                res.status(400).json({status: "ERROR" , message : "Cliente NO registrado."});
                return;
            }

            const paramsUpdate = { 
                ExpressionAttributeNames: { 
                    "#p": "password",
                    "#f": "fecha_cambio_password"
                },
                ExpressionAttributeValues: { 
                    ":p": newPassword, 
                    ":f": new Date().toISOString()
                },
                Key: { "id": data.Items[0].id },
                ReturnValues: "ALL_NEW",
                TableName: "cliente",
                UpdateExpression: "SET #p = :p, #f = :f" 
            };

            docClient.update(paramsUpdate, function (err, data) {
                if (err)  {
                    res.status(400).send({ status: "ERROR", message : "DB access error." });
                    return;
                } else {
                    res.status(200).send({ status: "OK", message : "updated" , "data": data });
                    return;
                }    
            });    
        }

        docClient.scan(paramsScan, callback);
    }
}