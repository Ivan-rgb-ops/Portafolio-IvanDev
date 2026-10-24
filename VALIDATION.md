# Revisión del refactor

## Ampliación Windows y capturas · 24 de octubre de 2026

- `npm run check`: sintaxis de 16 archivos de JavaScript.
- `npm test`: 19 pruebas de geometría, login y cancelación de temporizadores, movimiento reducido, atajos y AltGr, comandos permitidos de Ejecutar, preferencias, particiones de acoplamiento y conservación de ventanas en escritorios virtuales.
- Chromium: revisión en 375 × 672 y 1366 × 900.
- Entrada automática al escritorio y botón para omitir la espera, sin pedir una contraseña real.
- Ejecutar abre la galería con `ms-settings:personalization-background`. Se seleccionó un fondo de la colección y se cargó una imagen de prueba local; la selección personalizada se conservó al recargar.
- Crear un escritorio virtual, abrir Proyectos allí, mover la ventana al primero y cerrar el segundo sin perderla.
- Acoplamiento al cuadrante inferior derecho; menú de ventana, movimiento con flechas y cancelación con Esc.
- Administrador de tareas: finalizar Configuración; renombrar un acceso, enviarlo a la papelera y recuperarlo con Ctrl Z.
- Opción de apagar el escritorio: muestra la pantalla de apagado de la presentación.
- Tres miniaturas de proyectos cargadas desde recursos locales. Ampliación de las tres capturas, cierre con botón y con Esc, y devolución del foco a la miniatura.
- adaptIA y Estudio el Oso se capturaron desde sus páginas públicas. Chappie se capturó desde su HTML original sin iniciar servicios de voz, modelos ni comandos del sistema; la interfaz lo aclara en la vista ampliada.

Los atajos reservados por el sistema operativo dependen de si el navegador recibe la combinación; la guía ofrece alternativas Ctrl + Alt. No se probaron todos los atajos nativos del sistema ni se modificó la configuración del equipo. No se probaron DOOM, efectos de audio ni el envío de correo. La carga de fondo se probó con un recurso de prueba del proyecto y no transmite el archivo a un servidor.

## Revisión inicial

Revisión realizada el 23 de octubre de 2026.

## Verificaciones automáticas

- `npm run check`: sintaxis de la entrada y los siete módulos.
- `npm test`: cinco pruebas de geometría (barra accesible, mitades sin huecos, límites de ventana y tamaños pequeños).
- Servidor estático local: respuesta HTTP 200 y carga de módulos ES.

## Revisión de navegador

Se comprobaron en Chromium las vistas de escritorio (1280 × 720 y 782 × 884) y móvil (390 × 844):

- Inicio, búsqueda sin acentos y apertura del CV desde el teclado.
- Pestañas de habilidades del perfil y transcripción del currículum.
- Maximizado que reserva los 48 px de la barra de tareas.
- Minimizado y restaurado desde la barra.
- Arrastre hasta el borde izquierdo y acoplamiento a media pantalla.
- Selección y reordenamiento de accesos del escritorio.
- Cambio de tema claro/oscuro y estado de selección en Personalización.
- Explorador, proyectos y Configuración en pantalla móvil, sin superposición de la bandeja con la fecha.
- Terminal: ayuda y easter egg `coffee`.
- Campos obligatorios de contacto con etiquetas asociadas.
- Asistente: sugerencias y envío de una pregunta de contacto, con respuestas locales.
- Calendario: navegación entre meses; bloqueo y regreso a las ventanas abiertas; vista de tareas.

El formulario no se envió y no se abrió un cliente de correo durante las pruebas. El emulador externo de DOOM, las aplicaciones de destino de enlaces externos y los efectos de audio no fueron verificados en esta revisión.
