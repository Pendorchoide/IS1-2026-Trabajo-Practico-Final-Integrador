export const toClienteDTO = (item) => {
    if (!item) return null;
    const { password, ...rest } = item;
    return rest;
};

export const toClienteAuthDTO = (item) => {
    if (!item) return null;
    return {
        id: item.id,
        nombre: item.nombre,
        contacto: item.contacto,
        fecha_ultimo_ingreso: item.fecha_ultimo_ingreso
    };
};

export const toTicketDTO = (item) => {
    if (!item) return null;
    return {
        id: item.id,
        clienteID: item.clienteID,
        estado_solucion: item.estado_solucion,
        solucion: item.solucion,
        descripcion: item.descripcion,
        fecha_apertura: item.fecha_apertura,
        ultimo_contacto: item.ultimo_contacto
    };
};

export const toTicketResumenDTO = (item) => {
    if (!item) return null;
    return {
        id: item.id,
        fecha_apertura: item.fecha_apertura,
        estado_solucion: item.estado_solucion
    };
};
