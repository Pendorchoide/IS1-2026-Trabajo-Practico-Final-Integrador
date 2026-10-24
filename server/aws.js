import AWS from 'aws-sdk';
import accessKeyId from '../../accessKeyId.js';
import secretAccessKey  from '../../secretAccessKey.js';

// Declarar configuración de AWS
const AWS_CONFIG = {
    "region"         : "us-east-1",
    "endpoint"       : "http://dynamodb.us-east-1.amazonaws.com",
    "accessKeyId"    : accessKeyId, 
    "secretAccessKey": secretAccessKey
};

// Seteamos la configuración declarada AWS
AWS.config.update(AWS_CONFIG);


// Crea un DB client de Dynamo con AWS ya configurado
export const docClient = new AWS.DynamoDB.DocumentClient();
