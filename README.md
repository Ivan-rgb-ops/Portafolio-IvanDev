# Iván Pieretto · Portfolio OS

Portafolio interactivo inspirado en el escritorio de Windows 11. Los proyectos, el perfil, las habilidades, los canales de contacto y el CV original se presentan como aplicaciones de un escritorio web.

![Escritorio e Inicio](docs/start.png)

Capturas adicionales: [Explorador](docs/desktop.png) · [Vista móvil](docs/mobile.png).

## Ejecutar

Requiere Python 3 para el servidor local. No necesita instalar paquetes.

```sh
python server.py
```

Abrí **http://localhost:3000**. También podés usar `python -m http.server 3000` desde esta carpeta. Es necesario servirlo por HTTP: abrir `index.html` con doble clic no carga los módulos ES en todos los navegadores.

## El escritorio

- Barra de tareas de ancho completo, Inicio centrado, búsqueda, aplicaciones ancladas e indicadores de ventana activa.
- Inicio con búsqueda sin acentos, lista de aplicaciones, recomendaciones y opciones para bloquear o reiniciar el escritorio.
- Ventanas con controles a la derecha, arrastre, ocho bordes de redimensionamiento, foco, minimizado, restaurado y maximizado. Los extremos de la pantalla permiten acoplar a la izquierda, derecha o maximizar; también hay botones al pasar por Maximizar.
- Explorador con accesos rápidos, archivos recomendados, búsqueda, ordenación y cambio de vista.
- Accesos de escritorio con selección, doble clic, teclado y reordenamiento al arrastrarlos sobre otro acceso. El orden se guarda en el navegador. En dispositivos táctiles, un toque abre la aplicación.
- Temas claro y oscuro, Bloom, fondos originales del proyecto, colores de énfasis y preferencias persistentes.
- Calendario navegable, panel de configuración rápida y vista de tareas.
- Currículum con vista previa, transcripción y descarga del PDF original.
- Resumen para reclutadores, proyectos, perfil, contacto, terminal y asistente de preguntas sobre el portafolio.
- Diseño adaptable: en móviles, las ventanas ocupan el espacio disponible y la barra permite desplazar las aplicaciones si hay muchas abiertas.

La terminal incluye `help`, `about`, `projects`, `skills`, `contact`, `neofetch`, `whoami`, `dir`, `date`, `clear`, `open [aplicación]` y `theme [light|dark]`, además de los easter eggs originales (`coffee`, `matrix`, `doom`, `sudo hire-me`, `secrets`). DOOM carga un emulador de Archive.org al ejecutarlo y requiere conexión. El resto del escritorio usa recursos locales.

El asistente ofrece respuestas predefinidas locales; no está conectado a un servicio de IA. El formulario de contacto valida los campos y abre el cliente de correo del visitante mediante `mailto:`; el envío se completa allí. La pantalla de bloqueo es parte de la experiencia visual y no implementa autenticación.

## Atajos

| Atajo | Acción |
| --- | --- |
| `Ctrl / Cmd + K` | Buscar aplicaciones |
| `Ctrl + Alt + D` | Mostrar / restaurar el escritorio |
| `Ctrl + Alt + ← / →` | Acoplar la ventana activa |
| `Ctrl + Alt + ↑` | Maximizar / restaurar |
| `Ctrl + F6` | Cambiar entre ventanas visibles |
| `Esc` | Cerrar paneles |
| `Enter / Espacio` | Abrir un acceso enfocado |
| `↑ / ↓` en el escritorio | Mover el foco entre accesos |
| `↑ / ↓` en la terminal | Recorrer el historial |

Los atajos para ventanas no se interceptan mientras se escribe en un campo. Los paneles mantienen la navegación con Tab dentro de sus controles. Se respeta `prefers-reduced-motion` y se pueden desactivar las transiciones en Configuración.

## Organización

```text
index.html                   Shell y templates del contenido original
style.css                    Tokens, temas, shell, aplicaciones y responsive
app.js                       Inicio y coordinación de la interfaz
js/
  window-manager.js          Ciclo de vida, foco, arrastre y tamaño de ventanas
  geometry.js                Geometría de pantalla, límites y acoplamiento
  desktop.js                 Accesos, selección y reordenamiento
  apps.js                    Explorador, Configuración, Terminal y contenido
  preferences.js             Tema, fondos, énfasis y movimiento
  icons.js                   SVG compartidos y arte vectorial de aplicaciones
  config.js                  Registro de aplicaciones y almacenamiento seguro
assets/                      Fondos Bloom, favicon y créditos
terminal-easter-eggs.js       Easter eggs originales del proyecto
Ivan_Pieretto_CV.pdf          CV original descargable
cv_ivan_pieretto.jpg          Vista previa original del CV
wallpaper.jpg, wallpaper2.jpg Fondos originales
server.py                    Servidor local de desarrollo
tests/                       Pruebas de geometría con node:test
```

Se eliminaron las implementaciones duplicadas del gestor anterior, los controles semáforo, la magnificación del dock, la dependencia de animaciones GSAP y el CSS de utilidades que ya no se utiliza. Las plantillas conservan el contenido y los enlaces originales, y usan eventos declarados desde JavaScript en lugar de handlers HTML inline.

## Verificar

Node.js 18 o superior permite ejecutar las verificaciones, sin `npm install`:

```sh
npm run check
npm test
```

Las cinco pruebas verifican el espacio reservado a la barra, el reparto de pantallas con ancho impar, los límites del arrastre y el ajuste a pantallas pequeñas. Las interacciones de navegador se revisaron manualmente con automatización de UI; no hay una suite E2E incluida. Los detalles de la revisión se encuentran en `VALIDATION.md`.

## Publicar

Es una aplicación estática sin compilación. Serví la raíz del proyecto por HTTPS con los archivos HTML, CSS, JS y recursos, conservando la carpeta `js/`. Puede mantenerse el hosting estático existente. La rama del refactor no cambia la versión publicada hasta integrarla en la rama de despliegue.

## Créditos

Windows y Bloom pertenecen a Microsoft y sus respectivos autores. Este es un portafolio independiente inspirado en su interfaz. Consultá `assets/README.md` para los créditos de los fondos. El contenido profesional y el CV pertenecen a Iván Pieretto.
