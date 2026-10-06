---
title: "Cocinar con lo que hay en la alacena: iterar el hardware de un GPS tracker para trailers de hotshot"
description: "Cómo iteramos el hardware de un GPS tracker para trailers de hotshot de un cliente en Houston: de un Arduino Nano sin memoria suficiente a una placa comercial LilyGo, pasando por una placa reguladora y una PCB propias, y la pregunta externa del cliente que reveló meses sin cuestionar el diseño."
pubDate: 2026-10-05
lang: "es"
category: "Nota de Cata"
categorySlug: "nota-de-cata"
readingTime: 10
---

# Cocinar con lo que hay en la alacena: iterar el hardware de un GPS tracker para trailers de hotshot

Towit Houston llegó a nosotros con un problema que no era abstracto ni futurista: sus trailers de hotshot se perdían. No hablamos de un riesgo teórico de seguridad — el robo de carga en Norteamérica (Estados Unidos y Canadá) alcanzó 3,625 incidentes en 2024, un 27% más que el año anterior, con una pérdida promedio de $202,364 por incidente. Texas está entre los tres estados más golpeados del continente. Y cuando el equipo robado es rentado, como en el caso de Towit, la probabilidad de recuperarlo por vía de las autoridades cae a 10-15%, muy por debajo del ~60% que aplica para vehículos robados en general. Cada trailer sin visibilidad era, literalmente, dinero que podía desaparecer de la operación sin dejar rastro.

El pedido era concreto: un dispositivo que reportara la ubicación del trailer, funcionando con batería porque un trailer de hotshot no tiene alimentación eléctrica constante, y lo suficientemente robusto como para vivir semanas expuesto sin mantenimiento. Nada de eso era exótico en el papel. En la práctica, cada restricción —energía, espacio, exposición al ambiente— terminó forzando una decisión de diseño distinta, y algunas de esas decisiones tardamos más de lo debido en cuestionarlas.

![De varias placas separadas y cableadas a mano a una sola PCB integrada: el recorrido de iteración del GPS tracker para trailers de hotshot.](https://blog-media.ladetec.com/nitza-develop/gps-tracker-trailers-hotshot/gps-tracker-trailers-hotshot-1.webp)

## Primera iteración: Arduino Nano y componentes en placas separadas

Empezamos por lo que conocíamos. Arduino Nano con módulos GPS y celular externos conectados en una protoboard/shield genérica tenía sentido: librerías maduras para casi cualquier periférico, una curva de aprendizaje corta para el equipo, y la posibilidad de tener un prototipo funcionando en días. Es la misma lógica que aplicaría cualquier desarrollador bajo presión de tiempo —usar la librería que ya tenés integrada en vez de evaluar diez alternativas antes de escribir la primera línea. Cocinar con lo que hay en la alacena, no salir a comprar un ingrediente nuevo para cada plato.

![Primer prototipo: módulo celular apilado sobre un Arduino Nano en protoboard.](https://blog-media.ladetec.com/nitza-develop/gps-tracker-trailers-hotshot/gps-tracker-trailers-hotshot-2.webp)

![Módulo GPS NEO-6M conectado en protoboard junto al módulo celular, primera iteración.](https://blog-media.ladetec.com/nitza-develop/gps-tracker-trailers-hotshot/gps-tracker-trailers-hotshot-3.webp)

El límite apareció rápido, y fue físico, no de diseño: el binario no cabía. El ATmega328 que monta el Nano tiene 32KB de flash en total, de los cuales cerca de 2KB se destinan al bootloader, dejando unos 30KB utilizables. La lógica de lectura GPS, el manejo de conectividad celular y el control de energía en conjunto superaban ese espacio. No era un bug que se pudiera optimizar con paciencia; era un techo de memoria que ningún refactor iba a resolver, comparable a intentar meter un monolito con demasiadas dependencias en un contenedor con límite de imagen fijo.

## Segunda iteración: ESP32 con módulos externos (SIM7020G + GPS)

El salto a ESP32 resolvió el problema de memoria de inmediato. El ESP32-WROOM-32 monta 520KB de SRAM y 4MB de flash —un salto de orden de magnitud frente al Nano que dejó el espacio de almacenamiento fuera de la discusión. Mantuvimos el esquema de placas separadas, usando el ESP32 conectado a un módulo SIM7020G para conectividad y un módulo GPS NEO-6M. Esta segunda versión ya cumplía con lo básico: reportar posición, sobrevivir sin alimentación externa y aguantar a la intemperie.

![ESP32 conectado al módulo GPS NEO-6M y a la antena GPS externa, segunda iteración.](https://blog-media.ladetec.com/nitza-develop/gps-tracker-trailers-hotshot/gps-tracker-trailers-hotshot-4.webp)

![ESP32 cableado a un shield celular durante las pruebas de conectividad de la segunda iteración.](https://blog-media.ladetec.com/nitza-develop/gps-tracker-trailers-hotshot/gps-tracker-trailers-hotshot-5.webp)

![Banco de pruebas de la segunda iteración con el módulo regulador de energía conectado.](https://blog-media.ladetec.com/nitza-develop/gps-tracker-trailers-hotshot/gps-tracker-trailers-hotshot-6.webp)

Funcionaba. Pero "funciona" y "es la arquitectura correcta" no son la misma afirmación, y el problema ahora pasó a ser la autonomía energética.

## Tercera iteración: Placa propia para regulación LDO de bajo consumo

Con el problema de memoria resuelto, el cuello de botella pasó a ser la energía. Sin corriente constante, el tracker vive enteramente de batería, y esa batería tiene que aguantar semanas en modo sleep entre reportes de posición. Ahí el hardware comercial "de catálogo" no alcanzaba. 

Un regulador LDO genérico como el AMS1117, presente en la mayoría de las placas de desarrollo baratas de ESP32, consume entre 5 y 10mA incluso en reposo (corriente de reposo/quiescent current). Un LDO de bajo consumo como el MCP1700 baja ese número a ~1.6µA —varios órdenes de magnitud menos. Diseñamos nuestra propia placa adaptadora reguladora de 3.3V para alimentar el ESP32, sustituyendo la regulación que venía por defecto.

![Placa reguladora de bajo consumo diseñada a medida para alimentar el ESP32, con el módulo soldado sobre ella.](https://blog-media.ladetec.com/nitza-develop/gps-tracker-trailers-hotshot/gps-tracker-trailers-hotshot-7.webp)

![Render 3D del diseño de la placa reguladora propia antes de fabricarla.](https://blog-media.ladetec.com/nitza-develop/gps-tracker-trailers-hotshot/gps-tracker-trailers-hotshot-8.webp)

![Vista de ruteo de pistas de la placa reguladora de bajo consumo.](https://blog-media.ladetec.com/nitza-develop/gps-tracker-trailers-hotshot/gps-tracker-trailers-hotshot-9.webp)

![Primer plano del ESP32-WROOM-32 soldado sobre la placa reguladora ya fabricada.](https://blog-media.ladetec.com/nitza-develop/gps-tracker-trailers-hotshot/gps-tracker-trailers-hotshot-10.webp)

![Banco de pruebas de la placa reguladora propia junto al módulo celular, tercera iteración.](https://blog-media.ladetec.com/nitza-develop/gps-tracker-trailers-hotshot/gps-tracker-trailers-hotshot-11.webp)

![Segunda sesión de pruebas de la placa reguladora propia con el módulo celular conectado.](https://blog-media.ladetec.com/nitza-develop/gps-tracker-trailers-hotshot/gps-tracker-trailers-hotshot-12.webp)

Aplicamos el mismo criterio al módulo GPS NEO-6M: en operación normal consume 45mA, pero en Power Save Mode baja a 11mA. Sin un motor que mantuviera la batería cargada, cada miliamperio ahorrado se traducía directamente en más días de autonomía en campo. Es el mismo tipo de decisión que un arquitecto de software toma cuando elige entre un proceso que corre siempre en memoria o uno que se activa solo cuando hay trabajo real que hacer: el consumo de recursos en reposo importa tanto como el consumo bajo carga.

## Cuarta iteración: PCB a la medida (ESP32 + chip SIM7020G soldados)

Tener placas separadas unidas por cables y conectores en un entorno de alta vibración como un trailer de carga era una receta para fallas intermitentes. Decidimos dar un salto cualitativo e ir a un diseño electrónico propio a nivel de silicio/componente surface-mount. 

Diseñamos una placa PCB a la medida donde soldamos directamente el módulo ESP32, el chip SIM7020G, el circuito regulador de bajo consumo y las etapas de potencia/GPS. El resultado fue un bloque rígido, sin cables sueltos, con un footprint significativamente menor y una tolerancia al entorno industrial mucho más alta. 

![PCB a la medida con el ESP32 y el módem celular soldados directamente, eliminando los cables sueltos entre componentes.](https://blog-media.ladetec.com/nitza-develop/gps-tracker-trailers-hotshot/gps-tracker-trailers-hotshot-13.webp)

![Render 3D de la PCB a la medida, con los conectores GPS/LTE, zócalo MiniSIM y etapa de carga.](https://blog-media.ladetec.com/nitza-develop/gps-tracker-trailers-hotshot/gps-tracker-trailers-hotshot-14.webp)

![Vista de diseño 2D de la cara frontal de la PCB a la medida.](https://blog-media.ladetec.com/nitza-develop/gps-tracker-trailers-hotshot/gps-tracker-trailers-hotshot-15.webp)

![Vista de diseño 2D de la cara posterior de la PCB a la medida.](https://blog-media.ladetec.com/nitza-develop/gps-tracker-trailers-hotshot/gps-tracker-trailers-hotshot-16.webp)

![Primer plano del módulo ESP32-WROOM-32 soldado directamente sobre la PCB a la medida.](https://blog-media.ladetec.com/nitza-develop/gps-tracker-trailers-hotshot/gps-tracker-trailers-hotshot-17.webp)

![Primer plano del módem celular soldado directamente sobre la PCB a la medida.](https://blog-media.ladetec.com/nitza-develop/gps-tracker-trailers-hotshot/gps-tracker-trailers-hotshot-18.webp)

## El diseño mecánico: un doble fondo discreto en FreeCAD

La instalación física corrió en paralelo con la evolución de la electrónica. Diseñamos en FreeCAD un doble fondo dentro de la caja de conexiones del trailer para alojar la placa y la antena de forma discreta, sin interferir con el mecanismo eléctrico existente ni alterar la estética del equipo. No se trataba de esconder nada: era un problema de integración mecánica, resolver dónde vive un componente nuevo sin tocar ni degradar lo que ya estaba funcionando —el equivalente físico de agregar un servicio de monitoreo a un sistema sin modificar su interfaz pública.

![Compartimento interior impreso en 3D que aloja la placa y la antena dentro de la caja de conexiones del trailer.](https://blog-media.ladetec.com/nitza-develop/gps-tracker-trailers-hotshot/gps-tracker-trailers-hotshot-21.webp)

![Piezas impresas en 3D del compartimento de doble fondo, antes de ensamblar.](https://blog-media.ladetec.com/nitza-develop/gps-tracker-trailers-hotshot/gps-tracker-trailers-hotshot-22.webp)

![Detalle de los puntos de fijación del compartimento de doble fondo.](https://blog-media.ladetec.com/nitza-develop/gps-tracker-trailers-hotshot/gps-tracker-trailers-hotshot-23.webp)

Del lado del software, el backend fue deliberadamente simple: Django corriendo en PythonAnywhere, lo justo para recibir los reportes de posición y mostrarlos en un mapa. No había necesidad de construir más que eso para el problema que había que resolver.

## El giro: una pregunta desde afuera

Después de meses defendiendo cada decisión de hardware como la correcta y habiendo pasado por el trabajo de diseñar y soldar nuestras propias PCBs, en una llamada de seguimiento el cliente preguntó algo que no esperábamos: "¿por qué no usaron esa placa desde el principio?", refiriéndose a la LilyGo con módulo SIM7000G integrado, la placa comercial a la que acabábamos de migrar. 

![Placa comercial LilyGo con módulo celular SIM7000G integrado, quinta y última iteración.](https://blog-media.ladetec.com/nitza-develop/gps-tracker-trailers-hotshot/gps-tracker-trailers-hotshot-19.webp)

![Detalle de la placa LilyGo mostrando el portapilas integrado y las etiquetas de pines.](https://blog-media.ladetec.com/nitza-develop/gps-tracker-trailers-hotshot/gps-tracker-trailers-hotshot-20.webp)

Habíamos llegado a esa placa por una razón muy concreta, no por capricho: con la PCB propia ya en producción, sentimos el costo operativo de ensamblar y soldar cada unidad a mano, o de mandar a fabricar tiradas pequeñas de PCBs pobladas. La LilyGo integraba en una sola placa comercial el microcontrolador, el módem celular y el GPS, además del circuito de carga de batería —menos piezas, menor costo por unidad, cero horas de soldado manual, menos puntos de falla en campo y un firmware más simple de mantener, una consolidación parecida a reemplazar varios microservicios artesanales con un servicio gestionado que resuelve las mismas responsabilidades. Para un equipo que iba a tener que dar soporte remoto a decenas de dispositivos ya instalados en trailers repartidos por Texas, esa simplicidad no era un detalle estético: era menos superficie de error que depurar a distancia.

No teníamos una respuesta técnica sólida. Habíamos recorrido todo el camino lineal de iteración (Arduino → placas separadas → placa de regulación custom → PCB propia a la medida → LilyGo) porque cada paso era la respuesta inmediata al problema de la fase anterior, no porque hubiéramos evaluado el mercado completo de placas integradas desde el día uno. Alguien que no había probado cada plato anterior encontró en segundos algo que nosotros habíamos dejado de cuestionar durante meses de desarrollo.

## El principio: iterar rápido, pero agendar la mirada externa

La lección no es que haya que evaluar exhaustivamente cada opción antes de escribir código o soldar un componente —eso solo retrasa el aprendizaje que solo un prototipo real puede dar. Empezar con Arduino y módulos en protoboard nos permitió validar el concepto en días, y eso siguió siendo la decisión correcta en retrospectiva. 

El problema no fue empezar simple ni hacer PCBs a la medida: fue no haber programado, nosotros mismos, un punto de revisión con ojos que no cargaran con la misma pila de decisiones acumuladas. Esa mirada externa no tiene por qué llegar por casualidad en una llamada de seguimiento con el cliente —puede y debería agendarse a propósito, de la misma forma en que un equipo de software agenda un code review o un chequeo de arquitectura antes de escalar algo que nació como prueba de concepto.

## Resultado en producción

En su momento llegamos a tener más de 20 dispositivos de este diseño operando en trailers de Towit Houston, con un estado general de 75% de uptime, y casos de trailers recuperados después de más de un mes sin señal, porque el historial de ubicación previo seguía intacto en el backend.

La arquitectura final —LilyGo SIM7000G, doble fondo discreto en FreeCAD y backend ligero— es la que debería haber sido la primera candidata seria tras validar el software inicial. Llegar ahí por la ruta larga no invalidó el resultado, pero sí dejó clara la diferencia entre iterar progresivamente y dar un paso atrás a tiempo para mirar la despensa completa.

Si te pasó algo parecido —iterar tanto sobre una misma decisión técnica que dejaste de verla con claridad— contanos en nuestras redes sociales cómo lo resolviste.
