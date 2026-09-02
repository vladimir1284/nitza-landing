---
title: "La receta que nadie escribió: migrar 20 años de comisiones sin plan B"
description: "Cómo migramos un sistema legacy de comisiones de 20 años con un apagón total sin plan B: la convivencia de dos sistemas a mitad de mes, el cálculo recursivo de comisiones por generación de directores, y la decisión de entender el negocio antes de tocar el código."
pubDate: 2026-09-02
lang: "es"
category: "Nota de Cata"
categorySlug: "nota-de-cata"
readingTime: 8
---

![Cocina profesional fusionándose con una sala de servidores, representando la transición sin plan B de un sistema legacy de comisiones](https://blog-media.ladetec.com/nitza-develop/commission-engine/commission-engine-1.webp)

# La receta que nadie escribió: migrar 20 años de comisiones sin plan B

A las 23:59 del día 20 del mes, el sistema legacy se apagó. No hubo período de transición suave, no hubo un "probemos una quincena más con el sistema viejo por si acaso": el nuevo motor de comisiones entró a operar esa misma noche, y el viejo dejó de existir. Es el equivalente a cerrar la cocina que llevaba veinte años sirviendo el mismo menú y abrir, al día siguiente, un restaurante nuevo con la misma carta pero cocineros distintos, fogones distintos y, como descubriríamos pronto, una receta que nadie había escrito nunca en papel.

El resultado inmediato fue que las dos primeras quincenas del mes se calcularon con sistemas diferentes: una parte con el motor viejo, que ya no existía para consultarlo si algo no cuadraba, y otra con el nuevo, que todavía no conocía todas las reglas del negocio. Cuando un sistema de pagos convive así, sin un período real de verificación cruzada, la desconfianza no es un riesgo teórico: es casi aritmética. Cuando la ejecución en paralelo de dos sistemas no viene acompañada de una reconciliación estricta cifra por cifra, la sensación de seguridad que da "tener dos sistemas corriendo a la vez" es falsa, y las discrepancias en pagos generan justo el problema que vivimos: nadie sabe, en el momento del conflicto, en cuál de los dos números confiar. Esa fue la raíz de los cuatro meses siguientes: ciclos de comisiones con errores, trabajo codo a codo con el departamento de finanzas del cliente para reconciliar montos, y la pregunta repetida de si el problema estaba en el dato de origen, en la lógica nueva o en la lógica vieja que ya nadie podía volver a ejecutar.

## Una receta de veinte años, sin recetario

El sistema que reemplazábamos llevaba dos décadas en producción. El código fuente siempre estuvo disponible —eso hay que decirlo con claridad, no era una caja negra inaccesible—, pero disponible no es lo mismo que legible. Era un laberinto de SQL acumulado durante veinte años, con parámetros que, según el año en que se hubiera configurado el plan de comisiones, cambiaban por completo el camino que tomaba el cálculo. Ese patrón no es exótico ni exclusivo de este cliente: la acumulación de lógica condicional por parámetros es una forma de deuda técnica bien documentada, y hay evidencia empírica de que la presencia repetida de este tipo de "código espagueti" incrementa de forma medible el tiempo de trabajo y el esfuerzo cognitivo de quien tiene que modificarlo. No hacía falta que nadie nos lo advirtiera: bastaba con abrir el primer procedimiento almacenado y seguir el hilo de los IFs anidados para sentirlo.

El verdadero desafío, sin embargo, no era ese laberinto en sí, sino un plato específico dentro del menú: el pago por generación de directores.

## El plato imposible: comisiones recursivas tipo MLM

En el esquema de compensación del cliente, un director no solo cobraba por su propia red directa, sino por generaciones sucesivas de directores debajo de él —una estructura recursiva, del tipo que se ve en planes de compensación multinivel. Modelar eso técnicamente no es raro: existe un mecanismo estándar en SQL, las consultas recursivas con CTE, pensado exactamente para recorrer jerarquías organizacionales de profundidad variable. El problema no era la herramienta. El problema era que esa jerarquía cambiaba con el tiempo —directores que subían o bajaban de nivel, redes que se reorganizaban— y modelar correctamente una jerarquía que muta históricamente es un problema reconocido y difícil incluso en modelado de datos maduro, emparentado con lo que en almacenes de datos se conoce como dimensiones de cambio lento tipo 2. A eso se sumaba que no había suficientes datos históricos limpios para validar el cálculo contra algo, y que la persona que originalmente había diseñado esa lógica ya no estaba disponible para el equipo.

Es la peor combinación posible en una cocina: la receta más compleja del menú, sin el chef que la inventó, sin notas escritas, y con clientes ya sentados a la mesa esperando el plato.

![Platos de cerámica blanca anidados en forma de árbol, conectados por hilos dorados, representando la recursividad de las comisiones por generación de directores](https://blog-media.ladetec.com/nitza-develop/commission-engine/commission-engine-2.webp)

## Entender el negocio antes de tocar los fogones

Frente a ese escenario, el líder del proyecto tomó una decisión que en apariencia retrasaba el trabajo: no tocar el código todavía. Antes de escribir una sola línea de la nueva lógica de comisiones, el equipo se sentó a entender el negocio y las matemáticas detrás del plan de compensación —qué significaba una "generación", cómo se definía un director activo, qué pasaba cuando alguien cambiaba de nivel a mitad de mes— con el mismo departamento de finanzas con el que ya trabajaban para reconciliar los pagos.

Esa decisión tiene respaldo fuera de la anécdota. Eric Evans, el autor de referencia en diseño guiado por dominio, describe un fenómeno que llama "ceguera de legado" ("legacy blindness"): la familiaridad con el modelo de dominio existente termina siendo un obstáculo para pensar el problema de una forma distinta, porque el código viejo ya te dictó, sin que lo notes, cómo debe verse la solución nueva. Leer el SQL legacy línea por línea, sin entender antes qué problema de negocio resolvía cada parámetro, es exactamente la trampa que ese concepto describe: se termina replicando la estructura vieja —espagueti incluido— en vez de resolver el problema real.

El contraste con lo que puede salir mal en un corte total sin red de seguridad no es hipotético. Uno de los casos mejor documentados en la industria bancaria es la migración de TSB Bank en 2018: un cambio de sistema estilo "big bang", sin plan de reversión, que terminó en una multa regulatoria de £48.65 millones, más de £32 millones en compensaciones a clientes y la salida del CEO. No es un paralelo directo —TSB es un banco moviendo cuentas de clientes, no un motor de comisiones para una red de consultores— pero ilustra el mismo riesgo estructural: apagar lo viejo sin plan B y descubrir después, con el sistema en producción, que no se entendió bien lo que había que reemplazar.

## Por qué un bug pequeño se sentía tan grande

Había una razón adicional para ir con cautela: en un esquema de comisiones multinivel, un error pequeño en la lógica no se queda aislado en una cuenta. Por la propia naturaleza de estos planes, donde cada nivel depende del cálculo del nivel anterior, un bug en la forma de sumar una generación tiende a propagarse y afectar a la base completa de consultores a la vez, no a un caso puntual. Eso explica por qué cuatro meses de ciclos con errores generaron tanta fricción con el cliente: no eran fallas aisladas fáciles de aislar y corregir, sino desajustes que se replicaban estructuralmente cada vez que corría el cálculo.

## El punto en el que un error deja de ser un problema

Entender primero el negocio, y solo después tocar el código, no eliminó los errores de un día para otro. Los fue reduciendo ciclo tras ciclo, a medida que el equipo y finanzas lograban explicar cada discrepancia con una causa concreta en las reglas del plan, no con una sospecha genérica de "algo está mal en el sistema nuevo". Al final del proceso, quedó un error residual: unos 100 dólares de diferencia repartidos entre pagos que en conjunto sumaban cientos de miles de dólares, distribuidos entre miles de consultores. En una cocina, es la diferencia entre un plato perfecto y un plato correctamente sazonado: no existe la comisión perfecta a esa escala, existe la comisión suficientemente exacta como para que nadie en la mesa note la diferencia. El cliente lo aceptó como tal, y la relación no solo se sostuvo: hoy la empresa le confía otras piezas de su ecosistema tecnológico.

## El principio, más allá de las comisiones

Si estás por migrar un sistema legacy —de comisiones o de cualquier otra lógica de negocio compleja y acumulada durante años— la tentación natural es empezar por el código, porque el código es lo que se puede leer, depurar y versionar. Pero el código de veinte años no es la fuente de la verdad: es apenas el rastro, muchas veces contradictorio, de decisiones de negocio que se tomaron en momentos distintos y que casi nunca están documentadas en ningún otro lugar. Entender primero qué problema real resuelve cada regla —aunque eso retrase el primer commit— es lo que separa un corte de servicio bien digerido de uno que termina en pánico de madrugada.

Si esto te suena familiar, así lo resolvimos nosotros: cuéntanos tu versión en los comentarios, o síguenos para más casos como este.
