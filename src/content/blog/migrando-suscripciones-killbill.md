---
title: "La receta de Killbill y la cocina real: migrar suscripciones sin apagar el restaurante"
description: "Cómo migramos el motor de suscripciones de un cliente a Killbill sin downtime: el corte en frío en vez de la migración incremental que recomienda el manual, la integración con BigCommerce y Braintree, y los pagos parciales que Killbill no pudo resolver solo."
pubDate: 2026-08-31
lang: "es"
category: "Nota de Cata"
categorySlug: "nota-de-cata"
readingTime: 8
---

![Cocina profesional en pleno servicio, con el equipo trabajando en las distintas estaciones](https://blog-media.ladetec.com/nitza-develop/migrando-suscripciones-killbill/migrando-suscripciones-killbill-1.webp)

Antes de este proyecto, el equipo ya se había topado con esto: construir desde cero un motor de suscripciones propio para un cliente del rubro de renta de trailers. Crear la orden y cobrarla automáticamente cada ciclo fue, como se esperaba, la parte sencilla. Los problemas de verdad llegaron después: cancelaciones anticipadas a mitad de contrato, cambios de plan que no encajaban limpio en un ciclo de facturación ya en curso, atrasos de pago que había que perseguir uno por uno. El escenario real de un negocio de suscripciones, no el ideal de una demo.

Diseñar el menú de un negocio de suscripciones es la parte fácil: se define el plato, se fija el precio, y el sistema cobra el mismo monto cada mes sin que nadie tenga que acordarse. Cualquier plataforma resuelve eso sin dramas. Lo que separa una cocina que aguanta el servicio de un viernes por la noche de una que colapsa a la primera complicación es todo lo que pasa después de que el pedido ya salió — justo lo que ya le había quedado claro al equipo con aquel cliente de trailers. Ahí vive la complejidad real de cobrar suscripciones, y ahí es donde casi nadie mira antes de empezar a construir.

Esa experiencia fue la que llevó al equipo a no repetir, en este proyecto de migración, el camino de cocinar un motor de suscripciones desde cero otra vez. La apuesta fue [Killbill](https://killbill.io): un motor de facturación y suscripciones open source y autohospedable, que ya trae resuelto el catálogo de productos y planes, el ciclo de vida completo de una suscripción (alta, renovación, upgrade, downgrade, pausa, cancelación), la facturación y el motor de pagos. No hacía falta reinventar esa receta — hacía falta adaptarla a esta cocina en particular, la de un cliente que ya estaba cobrando en producción y no podía darse el lujo de apagar el servicio para cambiar de chef.

Killbill trae una guía oficial de migración muy bien pensada. El plan que propone es prudente: pasar las cuentas a la plataforma nueva de una en una, cada una con su propia fecha de corte (`cutOverDate`), mientras el sistema legacy sigue cobrando en paralelo a las cuentas que todavía no migraron. Es, literalmente, ir cambiando los ingredientes de la despensa uno por uno mientras el restaurante sigue sirviendo con la receta vieja.

Con este cliente esa receta no aplicaba. El modelo de negocio no toleraba tener dos cajas registradoras abiertas a la vez: si una cuenta quedaba a medio migrar, existía el riesgo real de cobrarle dos veces al mismo cliente, una vez desde el sistema legacy y otra desde Killbill. La única opción viable era un corte en frío: apagar el legacy de un solo golpe y arrancar el cobro nuevo el mismo día, sin la transición cuenta por cuenta que la documentación recomienda.

Ese primer choque entre "lo que dice el manual" y "lo que exige esta cocina en particular" se repitió varias veces a lo largo del proyecto. Vale la pena repasarlo, porque el patrón importa más que el caso puntual: la documentación oficial da la técnica probada; el negocio real decide cuánto de esa técnica se puede usar tal cual.

## El mismo sazón, aunque cambie de chef

Killbill trae un calendario de reintentos de pago configurable para suscripciones en mora, con estados como WARNING, BLOCKED y CANCELLATION. Es una receta lista para usar. Pero este cliente no llegaba con el paladar en blanco: ya cobraba suscripciones con su sistema legacy, y tenía su propio calendario de reintentos, afinado con su propia base de clientes — y ese fue el que se configuró en Killbill, no el que trae la plataforma por defecto. La plataforma da la estructura; el negocio aporta el sazón que ya sabía que funcionaba.

## Quien cocina no necesariamente cobra en caja

Por diseño, Killbill no toca métodos de pago. No guarda tarjetas ni credenciales: eso lo delega siempre a un plugin que habla con el gateway de pago, precisamente para no cargar con el peso de cumplimiento PCI. Es una separación de responsabilidades sana, como un chef que cocina el plato pero no maneja la caja.

El problema es que, en este proyecto, el camino más corto —Killbill hablando directo con Braintree— no era una opción. El modelo de negocio exigía que toda orden quedara registrada en BigCommerce, sin excepción. Así que el cobro no podía dispararse por la puerta trasera de Braintree: había que pasar por la ventanilla de BigCommerce, generando un token temporal propio, con una expiración pensada como la de un nonce de un solo uso, para completar el cargo sin saltarse el registro de la orden.

Esa restricción se sintió también al probar los primeros cargos automatizados. Fue mucho más simple y rápido validar el flujo con saldo de tienda y tarjetas de regalo que con métodos de pago guardados: en BigCommerce, para cobrar una orden después vía su API de pagos, esa orden debe crearse en estado "Incomplete", y el saldo de tienda —a diferencia del pago con tarjeta guardada— solo está disponible para cuentas registradas, no para compradores invitados. Son ingredientes de bodega, listos para usar sin pasar por el ciclo completo de tokenización que exige una tarjeta guardada.

## Cuando la cocina no sabe qué llevaba cada plato

La parte más incómoda de todo el proyecto fueron los pagos parciales. No es solo que Killbill no soporte que un solo pago cubra varias facturas a la vez —eso ya complica las cosas—. El fondo del problema fue otro, y este sí fue una decisión del proyecto, no una limitación de la plataforma: Killbill sí gestiona productos y planes como parte de su catálogo, pero en este proyecto los ítems de cada orden de BigCommerce no se modelaron como productos o planes dentro de Killbill. Así que cuando una orden tenía varios ítems y llegaba un pago parcial, Killbill no tenía visibilidad de esos ítems — no porque no pudiera tenerla, sino porque nunca llegaron a existir como tales dentro de su catálogo.

Es como llevar la cuenta de una mesa por comensal en vez de por plato: si la cocina nunca anotó qué llevaba cada plato de esa mesa, y llega un pago que cubre solo parte de la cuenta, no hay forma de decidir qué quedó saldado — aunque esa misma cocina sepa perfectamente, en general, cómo llevar la cuenta plato por plato. Esa ambigüedad, no una limitación de Killbill, fue la raíz real de la complejidad: hubo que resolver a nivel de plugin y proxy propio una lógica que, en este proyecto, Killbill nunca tuvo los datos para resolver sola.

![Diagrama de la documentación oficial de Killbill mostrando la arquitectura del sistema de pagos, incluyendo el plugin de pago y Kaui](https://blog-media.ladetec.com/nitza-develop/migrando-suscripciones-killbill/migrando-suscripciones-killbill-2.webp)

## Estaciones aisladas, no una sola llama

Para conectar Killbill con BigCommerce sin tocar Braintree directamente, el proyecto terminó con un plugin a la medida: Killbill habla con un proxy propio, y ese proxy es quien crea la orden y dispara el cobro en BigCommerce. Desarrollar una pieza así en un sistema que ya estaba cobrando en producción suena arriesgado, y lo sería si Killbill funcionara como una sola llama abierta.

No es así: los plugins de Killbill corren aislados en contenedores OSGi, cada uno con su propio ciclo de vida. Si una estación de la cocina falla, no apaga el resto del restaurante. Eso fue lo que permitió iterar sobre el plugin propio sin poner en riesgo el motor de suscripciones que ya estaba en marcha.

## El sazón fiscal cambia entre servicio y servicio

Incluso el requerimiento de impuestos, resuelto con Avalara, siguió el mismo patrón de fondo. El cálculo de impuesto para una suscripción SaaS depende de dónde se consume el servicio, no de dónde se factura, y ese cálculo puede cambiar de un ciclo de cobro al siguiente si cambia el producto, el precio o la ubicación del cliente. Por eso integrar ese cálculo directamente en el flujo de facturación —en cada corrida de cobro, no solo al dar de alta la suscripción— reduce el riesgo de que la receta fiscal quede desactualizada a mitad de servicio.

## La receta no es el plato

El patrón detrás de cada uno de estos puntos es el mismo. La documentación de una plataforma madura como Killbill da una técnica validada por muchas cocinas antes que la tuya: útil, probada, y punto de partida razonable. Pero ninguna documentación conoce las restricciones exactas de tu negocio —tu proveedor de pagos, tu plataforma de e-commerce, tu histórico de clientes, tu tolerancia al riesgo de cobrar dos veces. Adaptar la receta a esa cocina específica no es un atajo ni una improvisación: es el trabajo real.

Si te ha tocado tomar la guía oficial de una herramienta y ajustarla contra la realidad concreta de tu proyecto, seguramente reconoces el patrón. Cuéntanos en nuestras redes cómo resolviste tu propia versión de este problema — nos interesa comparar recetas.
