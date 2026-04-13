import Reveal from './index.ts';
import RevealMarkdown from '../plugin/markdown/index.ts';
import RevealHighlight from '../plugin/highlight/index.ts';
import RevealNotes from '../plugin/notes/index.ts';

import renderMathInElement from 'katex/contrib/auto-render/auto-render.ts';

import { type RevealApi } from './reveal';

const KaTexLocalPlugin = () => {
	let defaultOptions = {
		delimiters: [
			{left: '$$', right: '$$', display: true}, // Note: $$ has to come before $
			{left: '$', right: '$', display: false},
			{left: '\\(', right: '\\)', display: false},
			{left: '\\[', right: '\\]', display: true}
		],
		ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code']
	}

	return {
		id: 'katex-local',

		init: function (deck: RevealApi) {
			let revealOptions = deck.getConfig().katex ?? {};

			let options = {...defaultOptions, ...revealOptions};
			const {local, version, ...katexOptions} = options;

			const renderMath = () => {
				const slides = deck.getSlidesElement();

				if (slides) {
					renderMathInElement(slides, katexOptions);
					deck.layout();
				}
			}

			if( deck.isReady() ) {
				renderMath();
			}
			else {
				deck.on( 'ready', renderMath.bind(this));
			}
		}
	}
}

// More info about initialization & config:
// - https://revealjs.com/initialization/
// - https://revealjs.com/config/
// - https://revealjs.com/math/
Reveal.initialize({
	hash: true,

	// Learn about plugins: https://revealjs.com/plugins/
	plugins: [RevealMarkdown, RevealHighlight, RevealNotes, KaTexLocalPlugin],
});
