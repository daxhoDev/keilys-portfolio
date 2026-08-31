/**
 * Spanish — the default language and the source of truth for the dictionary type.
 *
 * Strings marked KEILY are her own words, verbatim, from specs/12-copy-from-keily.md.
 * Do not tidy them. Exactly two were edited, each by the smallest possible amount
 * and both disclosed to her (specs/09-open-decisions.md §5.8):
 *   · hero.subline    "Explora" -> "Exploro", so it matches the first-person headline
 *   · footer.tagline  ";" -> ":" plus a final stop
 *
 * Everything else is interface copy written on the build side (decision §5.4).
 */
export const es = {
  meta: {
    siteName: 'Keily Mar Couselo',
    home: {
      title: 'Keily Mar Couselo — Fotógrafa',
      description:
        'Fotógrafa autodidacta con base en Holguín. Blanco y negro de calle, mar, animales y personas: encuentros honestos entre lo que veo y lo que siento.',
    },
    about: {
      title: 'Sobre mí',
      description:
        'Keily Mar Couselo, fotógrafa autodidacta con base en Holguín: del aprendizaje junto a mi padre al blanco y negro como lenguaje expresivo propio.',
    },
    work: {
      title: 'Mi trabajo',
      description:
        'La galería completa de Keily Mar Couselo: fotografía en blanco y negro y en color de calles urbanas, pueblos de mar, animales y personas anónimas.',
    },
    notFound: { title: 'Página no encontrada' },
  },

  nav: {
    about: 'Sobre mí',
    work: 'Mi trabajo',
    contact: 'Contacto',
    menu: 'Abrir menú',
    closeMenu: 'Cerrar menú',
    skipToContent: 'Saltar al contenido',
  },

  lang: {
    switchTo: 'Cambiar idioma',
    es: 'ES',
    en: 'EN',
  },

  hero: {
    /** KEILY — approved as proposed. Three segments so the line can break and animate. */
    headline: ['Hola, soy Keily,', 'y soy', 'fotógrafa.'],
    /** KEILY — verbatim but for "Explora" -> "Exploro". */
    subline:
      'Artista autodidacta. Exploro el medio cotidiano en busca de sentido artístico, especialmente mediante las bondades del blanco y negro.',
    ctaPrimary: 'Escríbeme',
    ctaSecondary: 'Ver mi trabajo',
    scrollHint: 'Desliza',
    imageAlt: 'Fotografía de Keily Mar Couselo a pantalla completa.',
  },

  about: {
    eyebrow: 'Sobre mí',
    heading: 'Detrás de la cámara',
    /** KEILY — verbatim. */
    lead: 'Soy Keily Mar, fotógrafa autodidacta con una vocación que nació en la infancia y se consolidó en la adolescencia, cuando decidí explorar a fondo la técnica y el lenguaje artístico de la imagen.',
    /** KEILY — verbatim, split only at her own sentence boundaries. */
    body: [
      'Mi mirada se detiene en lo que suele pasar desapercibido: calles urbanas con sus secretos mejor guardados, pueblos de mar, rincones que cuentan historias silenciosas, animales como las palomas, y personas envueltas en su cotidianidad. Creo firmemente que cada instante tiene un peso visual y espiritual que merece ser eternizado.',
      'Por eso, en mis fotografías busco despojar la realidad del ruido cromático y revelar su esencia a través del blanco y negro. Así, cada captura se convierte en un encuentro honesto entre lo que veo y lo que siento. Bienvenido a mi mundo.',
    ],
    portraitAlt: 'Retrato de Keily Mar Couselo.',
    secondaryAlt: 'Keily Mar Couselo fotografiando.',
    cta: 'Leer más sobre mí',

    page: {
      title: 'Sobre mí',
      /** KEILY — the opening sentence of her long text, used as the lead. */
      lead: 'Mi vínculo con la fotografía nació en la infancia, de la mano de mi padre, cuya pasión por capturar instantes fue tan contagiosa como genuina.',
      /** KEILY — verbatim, split into 8 paragraphs at her own sentence boundaries. */
      body: [
        'Recuerdo sus explicaciones acerca de cómo lograr un encuadre preciso y cómo la luz podía transformar un rostro común en un valioso retrato. Esos primeros aprendizajes no fueron solo técnicos; fueron, sobre todo, una iniciación emocional en el arte de observar.',
        'En la adolescencia algo cambió en mi interior: el simple gusto por tomar fotos ya no era suficiente. Sentí la necesidad de transgredir mis propios límites y empezar a abordar esta disciplina desde una perspectiva más profesional y fundamentada en estudios. Fue entonces cuando emprendí un camino de estudio autodidacta que aún hoy continúo.',
        'Acudí a libros y a internet en busca de referentes y lecciones. Observé y consulté a fotógrafos consagrados y tomé cursos que ampliaron y consolidaron mi mirada. Cada nuevo conocimiento era una herramienta que sumaba a mi quehacer, y con cada herramienta, mi manera de ver el mundo se volvía más rica y más compleja.',
        'En ese proceso de evolución, fui encontrando un lenguaje que resonaba con mi sensibilidad: el blanco y negro. No fue una elección arbitraria, sino un descubrimiento progresivo. Descubrí que, al despojar una imagen del color, esta adquiría una nueva dimensión expresiva, un lenguaje más depurado que transmitía mensajes de una honestidad y una pureza difíciles de lograr en la paleta cromática. El blanco y negro me permite llegar al núcleo emocional de la escena, a su esencia más sincera.',
        'Sin embargo, no sería justo reducir mi trabajo a esa estética. La fotografía a color ocupa un lugar fundamental en mi quehacer creativo, especialmente cuando me enfrento a tonos fríos, que poseen una cualidad melancólica y poética, que tanto admiro. Azules, verdes y grises se convierten entonces en protagonistas de composiciones donde el color acompaña y potencia la narrativa visual.',
        'No me gusta poner límites ni encerrarme en fórmulas rígidas, prefiero mantener una actitud abierta y exploradora, dispuesta a recibir sugerencias y a embarcarme en proyectos innovadores, creativos y cargados de valor simbólico. Mi admiración por las artes en todas sus manifestaciones me impulsa a desear no solo contemplarlas, sino también producirlas.',
        'Paradójicamente, en mi infancia soñaba con ser actriz; dediqué varios años al teatro, aprendiendo a habitar personajes y a contar historias desde el cuerpo y la voz. Hoy, esa misma vocación narrativa se ha transformado: he pasado del frente de la cámara a la parte trasera de ella. Ahora soy quien maneja el dispositivo, quien elige el instante, quien convierte en actores de mi obra fotográfica a todos los que cruzan por mi lente.',
        'Cada persona, cada animal, las olas del mar y los rincones urbanos se convierten en intérpretes de una escena que escribo con luz y sombra. Esa es mi pasión, y es lo que deseo compartir contigo.',
      ],
      factsHeading: 'En corto',
      /** Provisional: she left the question blank, which is read as accepting the proposal. */
      facts: [
        { label: 'Con base en', value: 'Holguín' },
        { label: 'Trabajando desde', value: '2020' },
        { label: 'Fotografío', value: 'Calle, mar, animales, eventos culturales, personas' },
        { label: 'Idiomas', value: 'Español e Inglés' },
        { label: 'Equipo', value: 'Canon PowerShot SX400 IS' },
      ],
    },
  },

  work: {
    eyebrow: 'Mi trabajo',
    heading: 'Una selección',
    /** KEILY — verbatim. */
    lead: 'Instantáneas de encuentros honestos, entre lo que veo y lo que siento.',
    cta: 'Ver la galería completa',

    page: {
      title: 'Mi trabajo',
      lead: 'Instantáneas de encuentros honestos, entre lo que veo y lo que siento.',
    },

    filters: {
      label: 'Filtrar por tono',
      all: 'Todas',
      bw: 'Blanco y negro',
      colour: 'Color',
      empty: 'No hay fotografías en este filtro.',
      showAll: 'Ver todas',
    },

    photoCount: (n: number) => (n === 1 ? '1 fotografía' : `${n} fotografías`),
  },

  contact: {
    eyebrow: 'Contacto',
    heading: 'Hablemos',
    /** KEILY — verbatim. */
    lead: '¿Deseas contar una historia junto a mí? Estoy a un mensaje de distancia.',

    form: {
      name: {
        label: 'Nombre',
        placeholder: '¿Cómo te llamas?',
        error: {
          required: 'Escribe tu nombre.',
          tooShort: 'Tu nombre es demasiado corto.',
          tooLong: 'Ese nombre es demasiado largo.',
        },
      },
      email: {
        label: 'Correo electrónico',
        placeholder: '¿Dónde quieres que te responda?',
        error: { required: 'Escribe tu correo.', invalid: 'Ese correo no parece válido.' },
      },
      subject: {
        label: 'Asunto',
        placeholder: '¿De qué se trata? (opcional)',
        error: { tooLong: 'Ese asunto es demasiado largo.' },
      },
      message: {
        label: 'Mensaje',
        placeholder: 'Cuéntame qué tienes en mente',
        error: {
          required: 'Escribe tu mensaje.',
          tooShort: 'Cuéntame un poco más, con unas palabras basta.',
          tooLong: 'El mensaje es demasiado largo.',
        },
      },
      submit: 'Enviar mensaje',
      submitting: 'Enviando…',
      success: {
        heading: 'Mensaje enviado',
        body: 'Gracias por escribirme. Te responderé lo antes posible.',
        again: 'Escribir otro mensaje',
      },
      error: {
        heading: 'No se ha podido enviar',
        body: 'Algo ha fallado por el camino. Inténtalo otra vez, o escríbeme directamente por correo.',
        retry: 'Reintentar',
      },
      required: 'obligatorio',
      errorSummary: (n: number) =>
        n === 1 ? 'Hay 1 campo por corregir.' : `Hay ${n} campos por corregir.`,
    },

    socials: {
      heading: 'Puedes encontrarme en',
      instagramGallery: 'Instagram · Galería',
      instagramPersonal: 'Instagram · Personal',
      email: 'Correo electrónico',
    },

    directEmail: '¿Prefieres el correo? Escríbeme a',
  },

  lightbox: {
    label: 'Fotografía ampliada',
    close: 'Cerrar',
    previous: 'Anterior',
    next: 'Siguiente',
    counter: (i: number, n: number) => `${i} de ${n}`,
  },

  footer: {
    /** KEILY — verbatim but for ";" -> ":" and the final stop. */
    tagline: 'Las fotografías: epitafios de lo que vivo.',
    rights: 'Todos los derechos reservados.',
    navHeading: 'Navegación',
    contactHeading: 'Contacto',
  },

  notFound: {
    heading: 'Esta página no existe.',
    body: 'El enlace puede estar roto, o la página puede haber cambiado de sitio.',
    cta: 'Volver al inicio',
  },

  common: {
    loading: 'Cargando…',
    imageLoading: 'Cargando la imagen…',
  },
};
