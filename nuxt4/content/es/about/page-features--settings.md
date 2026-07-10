---
seo:
  title: Página de Configuración
  description: Documentación para la lectura, informes y configuración de cuentas de My Bible Log
og:
  title: Página de Configuración
  description: Documentación para la lectura, informes y configuración de cuentas de My Bible Log
---

![](/share.jpg)

# Página de Configuración

La página de Configuración está organizada en varios paneles:

* Cuenta
* Lectura
* Correos Recordatorios Diarios
* Exportar
* Importar

## Cuenta

Cuando se abre por primera vez la página de Configuración, se mostrará el panel de Cuenta.

Desde aquí puedes:

* cambiar tu dirección de correo electrónico
* eliminar tu cuenta

## Lectura

El panel de Lectura te permite ajustar las configuraciones relacionadas con la lectura de la Biblia. Estas incluyen tu **Objetivo Diario de Versículos** y **Fecha de Revisión**.

### Objetivo Diario de Versículos

Tu objetivo diario de versículos es la cantidad de versículos de la Biblia que deseas leer cada día. Esta configuración afecta la forma en que se comportan las barras de progreso en la página de Hoy y la página del Calendario.

Para ayudarte a decidir cuál debería ser tu objetivo diario de versículos, esta sección te muestra cuántos días tomará leer la Biblia si alcanzas tu objetivo diario de versículos. Por defecto, este valor es 86, lo que te permitirá leer toda la Biblia en menos de 365 días.

### Fecha de Revisión

Tu fecha de revisión determina hasta qué punto en tu registro de lectura My Bible Log buscará al determinar tu progreso. Tu fecha de revisión comienza siendo la fecha en que empezaste a usar My Bible Log.

Las entradas de registro anteriores a esta fecha son ignoradas. Como ejemplo, la página de Libros de la Biblia no mostrará la lectura que hayas hecho antes de tu fecha de revisión.

Si lees toda la Biblia y deseas comenzar de nuevo y leer cada parte de la Biblia nuevamente, configurar tu fecha de revisión a la fecha actual eliminará tu progreso en la página de Libros de la Biblia y permitirá que tus entradas de registro se consideren versículos "nuevos" nuevamente en la página de Hoy y la página del Calendario.

Cambiar tu fecha de revisión no eliminará ningún dato de My Bible Log. Todas tus entradas de registro aún existen y se pueden ver en cualquier momento desde la página del Calendario.

### Versión Preferida de la Biblia

Puedes elegir una traducción que prefieras para la lectura. Los enlaces de lectura externos abrirán esta traducción de la Biblia en tu aplicación de lectura preferida.

Si una traducción que deseas usar no está en la lista, por favor, solicítala con [este formulario](/es/feedback).

### Aplicación Preferida de la Biblia

Puedes elegir la aplicación o sitio web que se abrirá cuando hagas clic en un enlace de lectura.

Esta configuración se almacena en el dispositivo en lugar de en tu cuenta, lo que te permite usar diferentes aplicaciones o sitios web en diferentes dispositivos.

Si un sitio web o aplicación que deseas usar no está en la lista, por favor, solicítalo con [este formulario](/es/feedback).

## Correos Recordatorios Diarios

Puedes optar por recibir un recordatorio diario por correo electrónico de My Bible Log. El correo electrónico llegará en el momento que elijas.

### Optar

Debes confirmar que deseas recibir un correo electrónico recordatorio diario. My Bible Log no envía correos electrónicos no solicitados.

Puedes desactivar los correos recordatorios desde tu configuración en cualquier momento. Cada correo electrónico también contiene un enlace de cancelación de suscripción instantáneo.

### Hora del Recordatorio

Debes elegir una hora para recibir tu correo electrónico recordatorio diario. Esto permite que los recordatorios sean una parte útil e intencional de tu rutina diaria.

## Exportar

### Registro de Lectura (CSV)

Tu registro de lectura se puede exportar como una hoja de cálculo (en formato de archivo CSV). Esto te permite trabajar con tus datos de la manera que desees.

Si tienes habilidades de codificación o conoces a alguien que las tenga, podrías usar estos datos para crear nuevos gráficos. Incluso podrías combinar los datos de exportación de My Bible Log de varias personas.

A continuación se muestra un ejemplo de cómo se ve una hoja de cálculo de exportación de My Bible Log. Los encabezados "Fecha" y "Pasaje" no aparecerán en el archivo.

|Fecha|Pasaje|
|---|---|
|2020-07-21|Mateo 1-3|
|2020-07-22|Mateo 4-9|
|2020-07-22|Mateo 10-11|
|2020-07-23|Mateo 12-13|
|2020-07-23|Mateo 14-17|
|2020-07-24|Mateo 18-21|
|2020-07-24|Mateo 22-28|

A continuación se muestra cómo se ve el archivo CSV en un editor de texto. Observa cómo aparece una coma entre la fecha y el pasaje, ya que este es un archivo de valores separados por comas (CSV).

```csv
2020-07-21,Mateo 1-3
2020-07-22,Mateo 4-9
2020-07-22,Mateo 10-11
2020-07-23,Mateo 12-13
2020-07-23,Mateo 14-17
2020-07-24,Mateo 18-21
2020-07-24,Mateo 22-28
```

### Notas y Etiquetas (Archivo de Texto)

Puedes exportar tus notas y etiquetas en un archivo de texto.

Mientras que la exportación del registro de lectura (archivo CSV) se puede importar automáticamente de nuevo en My Bible Log, la exportación de notas no se puede importar automáticamente.
Sin embargo, siempre puedes recrear manualmente notas y etiquetas a partir de tu archivo de exportación si necesitas recuperar tus datos.

## Importar

Puedes importar una hoja de cálculo de registro de lectura (en formato de archivo CSV) a My Bible Log. Puedes importar una hoja de cálculo que hayas creado tú mismo, o puedes importar una hoja de cálculo que hayas exportado previamente de My Bible Log.

La función de importación de registro de lectura utiliza el mismo formato de archivo que la función de exportación de registro de lectura.

Cuando importas una hoja de cálculo, el progreso de importación se mostrará en la página. My Bible Log no recreará entradas de registro que ya existan. Si leíste Génesis 1 el 1 de enero y lo registraste en My Bible Log, luego importaste una hoja de cálculo que incluía una entrada de registro para ese mismo pasaje y fecha, My Bible Log la ignoraría.

<div class="mbl-button-group">
  <a class="mbl-button mbl-button--light" href="/es/settings">Ir a la página de Configuración</a>
</div>
