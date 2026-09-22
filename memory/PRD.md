# PRD — Slayed by Joana17 (Bilbao)

## Declaración original del problema
Diseñar una landing de alta conversión y un sistema de reservas para "Slayed by Joana17", salón de estilismo afro en Bilbao. La web debe ser bilingüe ES/EN, mostrar un catálogo con precios fijos y extras seleccionables, permitir reservar online, avisar por email, y ofrecer un panel administrativo para reservas, calendario, reseñas, ganancias, galería y ajustes. Estética final: blanco y rosa pastel.

## Datos del estudio
- Dirección: Barinaga 6, bajo derecha, Bilbao (editable desde Ajustes; también actualiza el mapa).
- Instagram: https://www.instagram.com/slayedbyjoana17/
- Bizum actual: 643723181 (editable desde Ajustes).

## Regla comercial actual
- Reserva sin cuenta; nombre y teléfono son suficientes. Google Sign-In es opcional.
- Métodos: tarjeta Stripe o Bizum.
- Ambos cobran exactamente el 50% del total como señal; el resto se paga en el salón.
- Efectivo está desactivado y el backend lo rechaza.
- Stripe está en modo live con la clave guardada solo en backend/.env.
- Los extras Kanekalon permiten cantidad y multiplican su precio.

## Horario, capacidad y duración
- Máximo 2 reservas activas por día.
- Lunes, martes, jueves y viernes: 14:30-19:00, intervalo 90 minutos.
- Miércoles cerrado.
- Sábado y domingo: 11:00-18:30, intervalo 90 minutos.
- Joana puede editar desde Ajustes: límite diario, intervalo, días abiertos/cerrados, horas y duración en minutos de cada servicio.
- Cada reserva guarda su duración real. Las citas largas bloquean los huecos siguientes para evitar solapamientos.
- Cuando un día alcanza el límite, la web muestra aviso de día completo e invita a escribir por Instagram para lista de espera.

## CMS del panel
- Pestaña Catálogo: editar todos los precios por matriz/largura/grosor, tamaños, opciones, precios simples y extras.
- También permite editar nombre visible, descripciones ES/EN, orden y visibilidad de cada servicio.
- Pestaña Contenido: editar textos principales ES/EN de portada, secciones, reserva, Sobre Joana, FAQ, footer, cinta animada y puntos destacados.
- Aviso/promoción configurable con textos ES/EN y activación instantánea.
- Servicios personalizados: crear/editar/eliminar servicios nuevos con categoría, duración, precio simple u opciones y descripciones ES/EN. Los servicios base solo se ocultan, no se borran.
- Lista de espera: cuando un día está completo, la clienta deja nombre, teléfono y email opcional. Joana la gestiona en Admin > Espera; si hay email, el sistema avisa al liberarse un hueco.
- Calendario admin: etiqueta "Completo" cuando un día alcanza el límite configurado.
- Los cambios se guardan en MongoDB y se aplican a landing, formulario y cálculo backend.

## Notificaciones
- Email a Joana al crear una reserva.
- Email de confirmación/cancelación a la clienta cuando facilita email.
- Recordatorio automático por email el día anterior a la cita.
- WhatsApp queda descartado por decisión de la usuaria.
- El envío de email está serializado y tiene reintentos para evitar pérdidas por límites temporales del proveedor.

## Arquitectura
- Frontend: React, Tailwind, shadcn/ui, Framer Motion, GSAP/ScrollTrigger, Lenis, SiteConfigContext e i18n ES/EN con overrides.
- Backend: FastAPI + MongoDB con Motor.
- Auth: JWT en cookie httpOnly para administración; Google Sign-In opcional para clientas.
- Email: Resend gestionado por Emergent.
- Pagos: Stripe Checkout mediante emergentintegrations con webhook /api/webhook/stripe; Bizum manual.
- Archivos: Object Storage gestionado por Emergent.
- QR público: /qr-slayedbyjoana17.png, apunta a https://slayedbyjoana17.com.

## Implementado
- Landing completa en blanco y rosa pastel con catálogo dinámico, galería, reserva, reseñas, sobre Joana, FAQ, contacto, mapa con dirección exacta, horario dinámico, Instagram y QR.
- Box Braids separado para mujer/hombre y sección Boho.
- Formulario con variante, extras, cantidades, total, señal 50%, resto, duración aproximada y elección Tarjeta/Bizum.
- Botón para copiar importe y número Bizum.
- Stripe crea Checkout Sessions por la mitad del total; ganancias registran solo la señal.
- Panel /admin con calendario, estados, señal Bizum, resto, ganancias, galería, reseñas, administradoras, horarios, duraciones, catálogo y contenido.
- Footer muestra horarios reales y dirección Barinaga 6, bajo derecha, Bilbao.

## Verificación más reciente
- Reporte CMS: /app/test_reports/iteration_5.json.
- Reporte servicios/lista de espera: /app/test_reports/iteration_7.json.
- Validación final: /app/test_reports/iteration_8.json.
- Backend: 13/13 pruebas pasan en /app/backend/tests/test_bookings_bizum.py.
- Frontend: yarn build correcto.
- Probado: edición/restauración de precios y textos, promo visible/oculta, visibilidad/orden de servicios, cálculo con precio editado, dirección y mapa.
- Datos TEST_* limpiados; reserva real preservada.

## Incidencia externa pendiente
- Dominio: slayedbyjoana17.com apunta a las IPs correctas, pero Cloudflare Proxy (nube naranja) bloquea SSL/enrutamiento. Debe cambiarse a "DNS only" (nube gris) y esperar propagación.

## Backlog priorizado
- P0: Desactivar Cloudflare Proxy y verificar https://slayedbyjoana17.com.
- P1: Marcar automáticamente como reservada una entrada de lista de espera si la clienta reserva el hueco.
- P1: Permitir elegir extras también en servicios personalizados.
- P2: Integración automática con Instagram.
- P2: Programa de fidelidad.
- P2: Dividir server.py en módulos si el backend sigue creciendo.

## Credenciales
Las credenciales activas y notas de prueba están en /app/memory/test_credentials.md.
