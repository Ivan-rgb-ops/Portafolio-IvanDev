# Iván Pieretto — Portfolio OS

Portfolio interactivo diseñado como un sistema operativo de escritorio moderno, intuitivo y responsivo. Presenta la trayectoria profesional, proyectos destacados, habilidades técnicas y canales de contacto de **Iván Pieretto** (Desarrollador Full Stack).

---

## 🚀 Cómo ejecutarlo localmente

### Opción 1: Directamente en el navegador
Hacé doble clic en el archivo `index.html` para abrirlo en cualquier navegador web moderno (Google Chrome, Microsoft Edge, Firefox, Safari, Brave).

### Opción 2: Con el servidor local incluido (Recomendado)
Para disfrutar de la experiencia completa con audio y módulos sin restricciones de seguridad de archivos locales:

```bash
python server.py
```

Luego abrí en tu navegador:
[http://localhost:3000](http://localhost:3000)

*(También podés usar cualquier otro servidor estático como `npx serve` o `python -m http.server 3000`)*.

---

## 📂 Estructura del Proyecto

```
portfolio-os/
├── index.html            # Estructura principal del sistema, ventanas y escritorio
├── style.css             # Sistema de diseño, estética Apple HIG, glassmorphism y temas
├── core.css              # Variables de tokens, efectos y animaciones clave
├── app.js                # Lógica del sistema: gestor de ventanas, audio procedural, colisiones
├── cv_ivan_pieretto.jpg  # Vista del currículum vitae oficial
├── Ivan_Pieretto_CV.pdf  # Documento oficial descargable del CV
├── wallpaper.jpg         # Fondo fotográfico Deep Space
├── wallpaper2.jpg        # Fondo fotográfico Cyber City
├── server.py             # Servidor HTTP local con desactivación de caché para desarrollo
└── README.md             # Documentación del proyecto
```

---

## ⚡ Características Principales

- **Gestor de Ventanas Multi-Tarea**: Apertura, arrastre fluido, minimizado, maximizado, cierre y cambio de foco con z-index dinámico y controles semáforo macOS.
- **Sistema de Audio Procedural Web Audio API**: Efectos sonoros táctiles generados en tiempo real (clic acústico, arranque, apertura/cierre de ventanas y desplazamiento sobre el Dock) con control de silencio.
- **Dock con Efecto Lupa (Magnification)**: Escalado con curva armónica y micro-animaciones interactivas.
- **Menú Contextual Inteligente**: Clic derecho con cambio de fondos de pantalla, organización automática de íconos y detección de bordes de pantalla.
- **Anti-Colisión de Íconos**: Sistema físico que impide que los íconos se encimen en el escritorio, con retorno elástico a su posición original.
- **Buscador Spotlight (`Ctrl + K` / `Cmd + K`)**: Paleta de comandos y navegación rápida por aplicaciones, proyectos y acciones.
- **Modo Reclutador (1 Clic)**: Resumen ejecutivo optimizado para procesos de selección con acceso directo a proyectos clave y descarga de CV.
- **Consola Terminal Interactiva**: Comandos UNIX (`neofetch`, `skills`, `projects`, `about`, `theme`, `clear`, `help`).
