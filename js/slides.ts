import Reveal from './reveal.js';
import type { RevealPluginFactory, RevealApi } from 'reveal.js';
import RevealMarkdown from '../plugin/markdown/index.ts';
import RevealHighlight from '../plugin/highlight/index.ts';
import RevealNotes from '../plugin/notes/index.ts';

import renderMathInElement from 'katex/contrib/auto-render/auto-render.ts';

import * as d3 from 'd3';
import { graphConnect, sugiyama, type GraphNode } from "d3-dag";


const KaTexLocalPlugin: RevealPluginFactory = () => {
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

document.addEventListener('DOMContentLoaded', async () => {
	const revealElement = document.querySelector('.reveal');

	if (!(revealElement instanceof HTMLElement)) {
		throw new Error('Unable to find presentation root (<div class="reveal">).');
	}

	const deck = new Reveal(revealElement);

	// More info about initialization & config:
	// - https://revealjs.com/initialization/
	// - https://revealjs.com/config/
	// - https://revealjs.com/math/
	await deck.initialize({
		hash: true,

		// Learn about plugins: https://revealjs.com/plugins/
		plugins: [RevealMarkdown, RevealHighlight, RevealNotes, KaTexLocalPlugin],
	});

	const slides = deck.getSlidesElement();

	if (slides) {
		const figure = slides.querySelector('#causal-diagram-example');
		if (figure) {
			const MARGIN = 32;
			const PAD_X = 10;
			const PAD_Y = 6;

			const builder = graphConnect();
			const dag = builder([["Smoking", "Cancer"], ["Smoking", "Stained Teeth"]]);

			const svg = d3
				.select(figure)
				.append('svg')
				.attr('style', 'width: auto; height: 500px;');

			const arrowId = 'arrow-end';
			svg.append('defs')
				.append('marker')
				.attr('id', arrowId)
				.attr('viewBox', '0 0 10 10')
				.attr('refX', 10)
				.attr('refY', 5)
				.attr('markerWidth', 6)
				.attr('markerHeight', 6)
				.attr('orient', 'auto')
				.append('path')
				.attr('d', 'M 0 0 L 10 5 L 0 10 z')
				.attr('fill', 'white');

			const sizeMap = new Map<
				GraphNode<string, [string, string]>,
				readonly [number, number]
			>();
			for (const n of dag.nodes()) {
				const probe = svg.append('g').attr('class', 'node');
				probe
					.append('text')
					.text(String(n.data));
				const box = (probe.node() as SVGGElement).getBBox();
				probe.remove();
				sizeMap.set(n, [box.width + 2 * PAD_X, box.height + 2 * PAD_Y]);
			}

			const layout = sugiyama()
			.gap([50, 50])
			.nodeSize((node: GraphNode<string, [string, string]>) => {
				const s = sizeMap.get(node);
				if (!s) throw new Error('missing measured node size');
				return s;
			});

			const { width, height } = layout(dag);

			svg
				.attr(
					'viewBox',
					`${-MARGIN} ${-MARGIN} ${width + 2 * MARGIN} ${height + 2 * MARGIN}`,
				)
				.attr('width', width + 2 * MARGIN)
				.attr('height', height + 2 * MARGIN);

			const boxInset = (halfW: number, h: number, ux: number, uy: number) => {
				const b = h / 2;
				const ax = Math.abs(ux), ay = Math.abs(uy);
				return ax < 1e-12 ? b / ay : ay < 1e-12 ? halfW / ax : Math.min(halfW / ax, b / ay);
			};

			const nodes = svg
				.selectAll<SVGGElement, GraphNode<string, [string, string]>>('g.node')
				.data(dag.nodes())
				.enter()
				.append('g')
				.attr('class', 'node')
				.attr('transform', (d) => `translate(${d.x}, ${d.y})`);

			nodes
				.append('rect')
				.attr('x', (d) => -sizeMap.get(d)![0] / 2)
				.attr('y', (d) => -sizeMap.get(d)![1] / 2)
				.attr('width', (d) => sizeMap.get(d)![0])
				.attr('height', (d) => sizeMap.get(d)![1])
				.attr('rx', (d) => {
					const [w, h] = sizeMap.get(d)!;
					return Math.min(8, w / 2, h / 2);
				})
				.attr('ry', (d) => {
					const [w, h] = sizeMap.get(d)!;
					return Math.min(8, w / 2, h / 2);
				});

			nodes.append('text')
				.attr('text-anchor', 'middle')
				.attr('dominant-baseline', 'central')
				.text((d) => d.data);

			svg
				.selectAll('g.link')
				.data([...dag.links()])
				.enter()
				.append('path')
				.attr('class', 'link')
				.attr('marker-end', `url(#${arrowId})`)
				.attr('d', (d) => {
					const sx = d.source.x!, sy = d.source.y!;
					const tx = d.target.x!, ty = d.target.y!;
					const [wS, hS] = sizeMap.get(d.source)!;
					const [wT, hT] = sizeMap.get(d.target)!;
					const vx = tx - sx, vy = ty - sy;
					const len = Math.hypot(vx, vy);
					if (len < 1e-12) return `M ${sx},${sy} L ${sx},${sy}`;
					const ux = vx / len, uy = vy / len;
					const t1 = boxInset(wS / 2, hS, ux, uy);
					const t2 = boxInset(wT / 2, hT, ux, uy);
					if (len <= t1 + t2) return `M ${sx},${sy} L ${sx},${sy}`;
					const x1 = sx + t1 * ux, y1 = sy + t1 * uy;
					const x2 = tx - t2 * ux, y2 = ty - t2 * uy;
					return `M ${x1},${y1} L ${x2},${y2}`;
				});
		}
	}

	deck.layout();
});
