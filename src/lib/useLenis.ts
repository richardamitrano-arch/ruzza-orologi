/**
 * Smooth-scroll (Lenis) è DISATTIVATO di proposito.
 *
 * Lo scroll nativo serve perché funzioni il CSS scroll-snap: i video a tutto
 * schermo (#intro, #luxury-bags-film, #prestigious-video) si fermano quando li
 * raggiungi, e proseguono solo se scrolli ancora deliberatamente.
 *
 * Lenis (momentum smooth-scroll) "scavalcava" i video e impediva lo snap.
 * Per riattivarlo in futuro: ripristinare l'init di Lenis qui e togliere il
 * blocco scroll-snap da index.css.
 */
export function useLenis() {}
