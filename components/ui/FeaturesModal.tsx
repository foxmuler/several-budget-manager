

import React from 'react';
import Modal from './Modal';
import { APP_VERSION } from '../../constants';

interface FeaturesModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const FeatureSection = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div>
        <h3 className="text-lg font-semibold text-primary-600 dark:text-primary-400 mb-2">{title}</h3>
        <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
            {children}
        </ul>
    </div>
);

const FeaturesModal = ({ isOpen, onClose }: FeaturesModalProps) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Características de Several v${APP_VERSION}`}>
            <div className="space-y-6 text-sm">
                <FeatureSection title="Gestión de Capitales">
                    <li>Creación, edición y eliminación de capitales.</li>
                    <li>Asignación de referencia, descripción, capital total y porcentaje usable.</li>
                    <li>Selector de color visual para cada capital.</li>
                    <li>Cálculo automático de capital disponible.</li>
                </FeatureSection>

                <FeatureSection title="Gestión de Gastos">
                    <li>Añadir, editar y eliminar gastos.</li>
                    <li>Asociación de gastos a un capital específico.</li>
                    <li>Escaneo de facturas con la cámara para autocompletar datos (Nº Ref. e Importe) usando IA (Gemini).</li>
                    <li>Validación para prevenir que los gastos excedan el capital disponible.</li>
                </FeatureSection>
                
                <FeatureSection title="Visualización de Datos">
                    <li>Gráfico de donut en la página principal que muestra la distribución y el uso de los capitales.</li>
                    <li>Tarjetas de capital con barras de progreso visuales.</li>
                    <li>Cálculo de total gastado y total usable en el gráfico.</li>
                </FeatureSection>

                <FeatureSection title="Organización y Ordenación">
                    <li>Ordenación de la lista de capitales por fecha, capital restante, nº de gastos o manual (arrastrar y soltar).</li>
                    <li>Ordenación del historial de gastos por fecha, importe o descripción.</li>
                </FeatureSection>

                <FeatureSection title="Archivado Automático (BackOffice)">
                    <li>Los capitales que llegan a cero se archivan automáticamente.</li>
                    <li>Visualización de capitales archivados en el "BackOffice" del menú lateral, agrupados por año.</li>
                    <li>Color configurable para los capitales archivados desde la configuración.</li>
                    <li>Restauración automática de capitales si su saldo vuelve a ser positivo.</li>
                    <li>Los capitales restaurados se marcan con una "R" para identificarlos.</li>
                </FeatureSection>

                <FeatureSection title="Funcionalidad Avanzada">
                    <li>Búsqueda y filtrado global (por texto, año, mes, día) desde el menú lateral.</li>
                    <li>Reasignación de gastos al eliminar un capital con gastos asociados.</li>
                    <li>Movimiento de gastos individuales entre capitales (doble clic en el gasto).</li>
                    <li>Opción para deshacer la eliminación del último gasto.</li>
                </FeatureSection>
                
                <FeatureSection title="Configuración y Personalización">
                    <li>Selector de tema: Claro, Oscuro o Sistema.</li>
                    <li>Exportación e importación de todos los datos en formato JSON.</li>
                    <li>Configuración del modo de ordenación por defecto para capitales y gastos.</li>
                </FeatureSection>
                
                <FeatureSection title="Experiencia de Usuario">
                    <li>Diseño responsive y adaptado a móviles (Progressive Web App).</li>
                    <li>Funcionalidad Offline-first gracias al almacenamiento local (IndexedDB).</li>
                    <li>Gestos táctiles para eliminar (deslizar en tarjetas de capital y gastos).</li>
                    <li>Notificaciones (toasts) para feedback de acciones del usuario.</li>
                </FeatureSection>
            </div>
        </Modal>
    );
};

export default FeaturesModal;