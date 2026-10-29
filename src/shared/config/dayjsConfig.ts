import dayjs from 'dayjs';
import 'dayjs/locale/es'; // Importa el idioma español
import localizedFormat from 'dayjs/plugin/localizedFormat'; // Plugin para formatos útiles
import relativeTime from 'dayjs/plugin/relativeTime'; // "hace 5 minutos" (notificaciones)

// Configurar el idioma globalmente
dayjs.locale('es'); 

// Extender dayjs con plugins si los necesitas
dayjs.extend(localizedFormat);
dayjs.extend(relativeTime);

export default dayjs;