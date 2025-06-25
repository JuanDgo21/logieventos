/**
 * Middleware para formatear y agregar fechas/horas a las solicitudes
 * Formato: DD-MM-YYYY - HH:MM AM/PM (Hora de Bogotá, Colombia)
 */

// Zona horaria de Bogotá, Colombia (UTC-5)
const TIMEZONE_OFFSET = -5 * 60 * 60 * 1000; // -5 horas en milisegundos

/**
 * Función para obtener la fecha y hora actual en formato de Bogotá
 * @returns {Object} Objeto con fecha formateada y hora formateada
 */
const getBogotaDateTime = () => {
    // 1. Obtener la fecha/hora actual en UTC
    const now = new Date();
    
    // 2. Ajustar a la zona horaria de Bogotá (UTC-5)
    const bogotaTime = new Date(now.getTime() + TIMEZONE_OFFSET);
    
    // 3. Formatear la fecha (DD-MM-YYYY)
    const day = String(bogotaTime.getDate()).padStart(2, '0');
    const month = String(bogotaTime.getMonth() + 1).padStart(2, '0'); // Los meses van de 0-11
    const year = bogotaTime.getFullYear();
    const formattedDate = `${day}-${month}-${year}`;
    
    // 4. Formatear la hora (HH:MM AM/PM)
    let hours = bogotaTime.getHours();
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12; // La hora 0 se convierte en 12
    const minutes = String(bogotaTime.getMinutes()).padStart(2, '0');
    const formattedTime = `${hours}:${minutes} ${ampm}`;
    
    return {
        date: formattedDate,
        time: formattedTime,
        fullDateTime: `${formattedDate} - ${formattedTime}`
    };
};

/**
 * Middleware que agrega timestamps a las solicitudes
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 * @param {Function} next - Función para pasar al siguiente middleware
 */
const dateFormatter = (req, res, next) => {
    try {
        console.log('Middleware dateFormatter ejecutándose...');
        
        // Obtener fecha/hora actualizada
        const { date, time, fullDateTime } = getBogotaDateTime();
        
        // Agregar a la solicitud para que las rutas puedan usarlo
        req.timestamp = {
            createdAt: fullDateTime,  // Fecha/hora completa
            dateOnly: date,           // Solo fecha
            timeOnly: time,           // Solo hora
            iso: new Date().toISOString() // También guardamos el ISO para posibles usos futuros
        };
        
        console.log('Timestamps agregados a la solicitud:', req.timestamp);
        
        next(); // Pasar al siguiente middleware/ruta
    } catch (error) {
        console.error('Error en dateFormatter:', error);
        next(error); // Pasar el error al manejador de errores
    }
};

module.exports = dateFormatter;