import { docClient } from "../aws.js";
import crypto from 'crypto';
import { toClienteDTO, toClienteAuthDTO } from "../utils/dto.js";

export class ClienteController {

    static getClienteById = (req,res) => {
        const { id } = req.params;
       
        const params = {
            TableName: "cliente",
            Key: { id }
        };
    
        const callback = (err, data) => {
            if (err)  {
                res.status(400).json({ status: "ERROR", message: "DB access error." });
                return;
            }
    
            if (!data.Item) {
                res.status(400).json({"response":"ERROR",message : "Cliente no existe."})
                return;
            }
            
            res.status(200).json({ 
                status: "OK", 
                data: {
                    cliente: toClienteDTO(data.Item)
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
            res.status(400).json({ status : "ERROR", message : "Se requiere un contacto." });
            return;
        }

        if (!password) {
            res.status(400).json({ status : "ERROR", message : "Se requiere contraseña" });
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
                res.status(500).json({ status: "ERROR", message: "DB Access Error" });
                return;
            }

            // Al igual que query, scan devuelve un array en 'Items'
            if (!data.Items || data.Items.length === 0) {
                res.status(404).json({ status: "ERROR", message: "Cliente no encontrado" });
                return;
            }

            const cliente = data.Items[0];
            
            if (password != cliente.password) {
                res.status(400).json({ status: "ERROR", message: "Credenciales Invalidas." });
                return;
            }

            if (!cliente.activo) {
                res.status(400).json({ status: "ERROR", message: "Cliente NO Activo." });
                return;
            }

            res.status(200).json({
                status: "OK",
                data: {
                    cliente: toClienteAuthDTO(cliente)
                }
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
                        data: {
                            cliente: toClienteDTO(newCliente)
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
            res.status(400).json({status: "ERROR" , message: "Se requiere CONTACTO"});
            return;
        }

        if (!newPassword) {
            res.status(400).json({status: "ERROR" , message: "Se requiere NEW_PASSWORD"});
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
                    res.status(400).json({ status: "ERROR", message : "DB access error." });
                    return;
                } else {
                    res.status(200).json({ status: "OK", data: { message: "Contraseña actualizada correctamente" } });
                    return;
                }    
            });    
        }

        docClient.scan(paramsScan, callback);
    }

    static updateClienteById = (req,res) => {
        const { id } = req.params;
        const { nombre, password, activo, registrado } = req.body;

        if (!id) {
            res.status(400).json({ status: "ERROR", message: "Se requiere ID."});
            return;
        }

        if (!nombre) {
            res.status(400).json({ status: "ERROR", message: "Se requiere NOMBRE"});
            return;
        }

        if (!password) {
            res.status(400).json({ status: "ERROR", message: "Se requiere CONTRASEÑA"});
            return;
        }

        const params = {
            TableName: "cliente",
            Key: { id }
        };

        const callback = (err, data) => {
            if (err)  {
                res.status(400).json({ status: "ERROR", message : "DB access error." });
                return;
            } 

            if (!data.Item) {
                    res.status(400).json({ "response":"ERROR",message : "Cliente no existe" });
                    return;
            }


            const paramsUpdate = { 
                ExpressionAttributeNames: { 
                    "#a": "activo", 
                    "#n": "nombre",
                    "#p": "password",
                    "#r": "registrado"
                }, 
                ExpressionAttributeValues: { 
                    ":a": activo , 
                    ":p": password,
                    ":n": nombre , 
                    ":r": registrado 
                },
                Key: { 
                    "id": id 
                },
                ReturnValues: "ALL_NEW", 
                TableName: "cliente", 
                UpdateExpression: "SET #n = :n, #p = :p, #a = :a, #r = :r" 
            };

            docClient.update(paramsUpdate, (err, dataUpdate) => {
                if (err)  {
                    res.status(400).json({ status: "ERROR", message : "DB access error." });
                    return;
                }
                
                res.status(200).json({ status: "OK", data: { cliente: toClienteDTO(dataUpdate.Attributes) } });
            });
        }
            
        docClient.get(params, callback);
    }
}