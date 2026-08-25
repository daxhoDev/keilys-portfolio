import type { Dictionary } from './types.ts';

/**
 * English — translated from Spanish, not authored independently.
 *
 * This ships without Keily's review (specs/09-open-decisions.md §5.3), so it is
 * treated as authored work rather than a conversion job: her biography carries a
 * voice, and with no review gate behind it a flattened version would ship unnoticed.
 * Where a literal rendering would sound stiff in English, the sense is kept and the
 * phrasing is hers in spirit — never expanded, never editorialised.
 *
 * The type annotation is the parity check: a key missing here is a build error.
 */
export const en: Dictionary = {
  meta: {
    siteName: 'Keily Mar Couselo',
    home: {
      title: 'Keily Mar Couselo — Photographer',
      description:
        'Self-taught photographer based in Holguín. Black and white of streets, sea, animals and people: honest encounters between what I see and what I feel.',
    },
    about: {
      title: 'About me',
      description:
        'Keily Mar Couselo, a self-taught photographer based in Holguín: from learning beside my father to black and white as an expressive language of my own.',
    },
    work: {
      title: 'My work',
      description:
        'The gallery of Keily Mar Couselo: black and white and colour — city streets, seaside towns, animals, and people wrapped up in their everyday lives.',
    },
    notFound: { title: 'Page not found' },
  },

  nav: {
    about: 'About',
    work: 'My work',
    contact: 'Contact',
    menu: 'Open menu',
    closeMenu: 'Close menu',
    skipToContent: 'Skip to content',
  },

  lang: {
    switchTo: 'Change language',
    es: 'ES',
    en: 'EN',
  },

  hero: {
    headline: ["Hello, I'm Keily,", 'and I’m a', 'photographer.'],
    subline:
      'A self-taught artist. I explore the everyday in search of artistic meaning, above all through what black and white can give.',
    ctaPrimary: 'Get in touch',
    ctaSecondary: 'See my work',
    scrollHint: 'Scroll',
    imageAlt: 'A full-screen photograph by Keily Mar Couselo.',
  },

  about: {
    eyebrow: 'About me',
    heading: 'Behind the camera',
    lead: 'I’m Keily Mar, a self-taught photographer with a calling that began in childhood and took hold in my teens, when I decided to explore the craft and the artistic language of the image in earnest.',
    body: [
      'My eye settles on what usually goes unnoticed: city streets with their best-kept secrets, seaside towns, corners that tell quiet stories, animals such as the pigeons, and people wrapped up in their everyday. I firmly believe that every moment carries a visual and spiritual weight that deserves to be made lasting.',
      'That is why, in my photographs, I try to strip reality of its chromatic noise and reveal its essence through black and white. Each frame becomes an honest encounter between what I see and what I feel. Welcome to my world.',
    ],
    portraitAlt: 'A portrait of Keily Mar Couselo.',
    secondaryAlt: 'Keily Mar Couselo photographing.',
    cta: 'Read more about me',

    page: {
      title: 'About me',
      lead: 'My bond with photography began in childhood, at my father’s side, whose passion for capturing moments was as contagious as it was genuine.',
      body: [
        'I remember him explaining how to find a precise frame, and how light could turn an ordinary face into a portrait worth keeping. Those first lessons were not only technical; above all they were an emotional initiation into the art of looking.',
        'In my teens something shifted. Simply enjoying taking photographs was no longer enough. I felt the need to push past my own limits and approach the discipline from a more professional footing, grounded in study. That was when I set out on a path of teaching myself, one I am still on today.',
        'I turned to books and to the internet in search of references and lessons. I studied and consulted established photographers, and took courses that widened and settled my eye. Every new piece of knowledge was a tool added to the work, and with every tool, my way of seeing the world grew richer and more complex.',
        'Somewhere in that process I found a language that resonated with my sensibility: black and white. It was not an arbitrary choice but a gradual discovery. I found that stripping an image of colour gave it a new expressive dimension, a purer language carrying an honesty and a clarity that are hard to reach in a chromatic palette. Black and white lets me get to the emotional core of a scene, to its most truthful essence.',
        'It would not be fair, though, to reduce my work to that aesthetic. Colour photography holds a fundamental place in what I make, especially when I am working with cool tones, which have a melancholy, poetic quality I admire enormously. Blues, greens and greys then become the protagonists of compositions where colour accompanies and strengthens the visual narrative.',
        'I don’t like setting limits or shutting myself inside rigid formulas. I would rather stay open and exploratory, ready to take suggestions and to throw myself into projects that are inventive, creative and rich in meaning. My admiration for the arts in every form drives me not only to contemplate them but to make them.',
        'Fittingly enough, as a child I dreamed of being an actress; I spent several years in theatre, learning to inhabit characters and to tell stories with body and voice. Today that same instinct for narrative has changed shape: I have moved from in front of the camera to behind it. Now I am the one working the device, choosing the moment, turning everyone who crosses my lens into an actor in the photographic work.',
        'Every person, every animal, the waves of the sea and the corners of the city become performers in a scene I write with light and shadow. That is my passion, and it is what I want to share with you.',
      ],
      factsHeading: 'In short',
      facts: [
        { label: 'Based in', value: 'Holguín' },
        { label: 'Working since', value: '2020' },
        { label: 'I photograph', value: 'Streets, the sea, animals, cultural events, people' },
        { label: 'Languages', value: 'Spanish and English' },
        { label: 'Equipment', value: 'Canon PowerShot SX400 IS' },
      ],
    },
  },

  work: {
    eyebrow: 'My work',
    heading: 'A selection',
    lead: 'Glimpses of honest encounters, between what I see and what I feel.',
    cta: 'See the full gallery',

    page: {
      title: 'My work',
      lead: 'Glimpses of honest encounters, between what I see and what I feel.',
    },

    filters: {
      label: 'Filter by tone',
      all: 'All',
      bw: 'Black & white',
      colour: 'Colour',
      empty: 'No photographs in this filter.',
      showAll: 'Show all',
    },

    photoCount: (n: number) => (n === 1 ? '1 photograph' : `${n} photographs`),
  },

  contact: {
    eyebrow: 'Contact',
    heading: 'Let’s talk',
    lead: 'Would you like to tell a story with me? I’m one message away.',

    form: {
      name: {
        label: 'Name',
        placeholder: 'What you go by',
        error: { required: 'Please enter your name.', tooShort: 'That name is too short.' },
      },
      email: {
        label: 'Email',
        placeholder: 'where you’d like me to reply',
        error: {
          required: 'Please enter your email.',
          invalid: 'That email doesn’t look right.',
        },
      },
      subject: { label: 'Subject', placeholder: 'What it’s about (optional)' },
      message: {
        label: 'Message',
        placeholder: 'Tell me what you have in mind',
        error: {
          required: 'Please write your message.',
          tooShort: 'Tell me a little more — a few words is enough.',
          tooLong: 'That message is too long.',
        },
      },
      submit: 'Send message',
      submitting: 'Sending…',
      success: {
        heading: 'Message sent',
        body: 'Thank you for writing. I’ll get back to you as soon as I can.',
        again: 'Write another message',
      },
      error: {
        heading: 'It didn’t send',
        body: 'Something went wrong on the way. Try again, or email me directly.',
        retry: 'Try again',
      },
      required: 'required',
      errorSummary: (n: number) =>
        n === 1 ? 'There is 1 field to fix.' : `There are ${n} fields to fix.`,
    },

    socials: {
      heading: 'Also find me on',
      instagramGallery: 'Instagram · gallery',
      instagramPersonal: 'Instagram · personal',
      email: 'Email',
    },

    directEmail: 'Prefer email? Write to',
  },

  lightbox: {
    label: 'Enlarged photograph',
    close: 'Close',
    previous: 'Previous',
    next: 'Next',
    counter: (i: number, n: number) => `${i} of ${n}`,
  },

  footer: {
    tagline: 'Photographs: epitaphs of what I live.',
    rights: 'All rights reserved.',
    navHeading: 'Navigation',
    contactHeading: 'Contact',
  },

  notFound: {
    heading: 'This page doesn’t exist.',
    body: 'The link may be broken, or the page may have moved.',
    cta: 'Back to the homepage',
  },

  common: {
    loading: 'Loading…',
    imageLoading: 'Loading the image…',
  },
};
