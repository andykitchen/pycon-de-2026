import Reveal from './index.ts';
import RevealMarkdown from '../plugin/markdown/index.ts';
import RevealHighlight from '../plugin/highlight/index.ts';
import RevealNotes from '../plugin/notes/index.ts';
import RevealMath from '../plugin/math/index.ts';

// More info about initialization & config:
// - https://revealjs.com/initialization/
// - https://revealjs.com/config/
// - https://revealjs.com/math/
Reveal.initialize({
    hash: true,

    // Learn about plugins: https://revealjs.com/plugins/
    plugins: [RevealMarkdown, RevealHighlight, RevealNotes, RevealMath.KaTeX],
});