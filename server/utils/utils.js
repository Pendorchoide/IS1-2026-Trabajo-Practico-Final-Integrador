import { docClient } from "../aws.js";

export const validateCredentials = (id, password, onResult) => {
    /**
     *  Valida que exista un usuario con ese ID y contraseña
     *  Envía TRUE o FALSE a través del callback 'onResult'
     */

    const paramsDB = {
        TableName: "cliente",
        Key: { 
            "id": id 
        }
    };

    const callback = (err, data) => {
        if (err) {
            console.error("Error en DB:", err);
            onResult(false);
            return;
        }

        if (!data.Item) {
            onResult(false);
            return;
        }

        const cliente = data.Item;

        if (password != cliente.password) {
            onResult(false);
            return;
        }

        if (!cliente.activo) {
            onResult(false);
            return;
        }

        onResult(true);
    };
    
    docClient.get(paramsDB, callback);
}