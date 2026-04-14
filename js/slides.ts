import Reveal from './reveal.js';
import type { RevealPluginFactory, RevealApi } from 'reveal.js';
import RevealMarkdown from '../plugin/markdown/index.ts';
import RevealHighlight from '../plugin/highlight/index.ts';
import RevealNotes from '../plugin/notes/index.ts';

import renderMathInElement from 'katex/contrib/auto-render/auto-render.ts';

import * as d3 from 'd3';
import { graphConnect, sugiyama, type GraphNode } from "d3-dag";

type CausalEdge = {
	source: string;
	target: string;
	className?: string;
	fragmentIndex?: number;
};

type CausalNodeOverride = {
	label: string;
	className?: string;
	fragmentIndex?: number;
};

const DIAGRAM_MARGIN = 32;
const NODE_PAD_X = 10;
const NODE_PAD_Y = 6;
const DIAGRAM_STYLE = 'width: auto; height: 500px;';

const edgeKey = (source: string, target: string): string => `${source}->${target}`;

const boxInset = (halfW: number, h: number, ux: number, uy: number): number => {
	const halfH = h / 2;
	const absX = Math.abs(ux);
	const absY = Math.abs(uy);
	if (absX < 1e-12) return halfH / absY;
	if (absY < 1e-12) return halfW / absX;
	return Math.min(halfW / absX, halfH / absY);
};

const edgePath = (
	source: GraphNode<string, [string, string]>,
	target: GraphNode<string, [string, string]>,
	sizeMap: Map<GraphNode<string, [string, string]>, readonly [number, number]>,
): string => {
	const sx = source.x!;
	const sy = source.y!;
	const tx = target.x!;
	const ty = target.y!;
	const [sourceWidth, sourceHeight] = sizeMap.get(source)!;
	const [targetWidth, targetHeight] = sizeMap.get(target)!;
	const vx = tx - sx;
	const vy = ty - sy;
	const len = Math.hypot(vx, vy);
	if (len < 1e-12) return `M ${sx},${sy} L ${sx},${sy}`;
	const ux = vx / len;
	const uy = vy / len;
	const sourceInset = boxInset(sourceWidth / 2, sourceHeight, ux, uy);
	const targetInset = boxInset(targetWidth / 2, targetHeight, ux, uy);
	if (len <= sourceInset + targetInset) return `M ${sx},${sy} L ${sx},${sy}`;
	const x1 = sx + sourceInset * ux;
	const y1 = sy + sourceInset * uy;
	const x2 = tx - targetInset * ux;
	const y2 = ty - targetInset * uy;
	return `M ${x1},${y1} L ${x2},${y2}`;
};

const addArrowHead = (svg: d3.Selection<SVGSVGElement, unknown, null, undefined>, markerId: string): void => {
	svg.append('defs')
		.append('marker')
		.attr('id', markerId)
		.attr('viewBox', '0 0 10 10')
		.attr('refX', 10)
		.attr('refY', 5)
		.attr('markerWidth', 6)
		.attr('markerHeight', 6)
		.attr('orient', 'auto')
		.append('path')
		.attr('d', 'M 0 0 L 10 5 L 0 10 z')
		.attr('fill', 'context-stroke');
};

type LabelMeasurer = {
	measure: (label: string) => readonly [number, number];
	dispose: () => void;
};

const createLabelMeasurer = (): LabelMeasurer => {
	const svgNs = 'http://www.w3.org/2000/svg';
	const measurementSvg = document.createElementNS(svgNs, 'svg');
	measurementSvg.setAttribute('aria-hidden', 'true');
	measurementSvg.style.position = 'absolute';
	measurementSvg.style.left = '-10000px';
	measurementSvg.style.top = '-10000px';
	measurementSvg.style.visibility = 'hidden';
	measurementSvg.style.pointerEvents = 'none';
	measurementSvg.style.width = '0';
	measurementSvg.style.height = '0';
	measurementSvg.style.overflow = 'visible';

	const group = document.createElementNS(svgNs, 'g');
	group.setAttribute('class', 'node');
	const text = document.createElementNS(svgNs, 'text');
	group.appendChild(text);
	measurementSvg.appendChild(group);
	document.body.appendChild(measurementSvg);

	return {
		measure: (label: string): readonly [number, number] => {
			text.textContent = label;
			const box = text.getBBox();
			return [Math.max(1, box.width), Math.max(1, box.height)];
		},
		dispose: (): void => {
			measurementSvg.remove();
		},
	};
};

const renderCausalDiagram = (
	figure: Element,
	markerId: string,
	edges: readonly CausalEdge[],
	nodeOverrides: readonly CausalNodeOverride[] = [],
): void => {
	figure.replaceChildren();
	const builder = graphConnect();
	const dag = builder(edges.map(({ source, target }) => [source, target] as [string, string]));
	const edgeClassMap = new Map(edges.map((e) => [edgeKey(e.source, e.target), e.className ?? '']));
	const edgeFragmentIndexMap = new Map(
		edges
			.filter((e) => e.fragmentIndex !== undefined)
			.map((e) => [edgeKey(e.source, e.target), e.fragmentIndex!]),
	);
	const nodeOverrideMap = new Map(nodeOverrides.map((o) => [o.label, o]));
	const labelMeasurer = createLabelMeasurer();

	const svg = d3
		.select(figure)
		.append('svg')
		.attr('style', DIAGRAM_STYLE);

	addArrowHead(svg, markerId);

	const sizeMap = new Map<
		GraphNode<string, [string, string]>,
		readonly [number, number]
	>();

	for (const node of dag.nodes()) {
		const [textWidth, textHeight] = labelMeasurer.measure(String(node.data));
		sizeMap.set(node, [textWidth + 2 * NODE_PAD_X, textHeight + 2 * NODE_PAD_Y]);
	}
	labelMeasurer.dispose();

	const layout = sugiyama()
		.gap([50, 50])
		.nodeSize((node: GraphNode<string, [string, string]>) => {
			const size = sizeMap.get(node);
			if (!size) throw new Error('missing measured node size');
			return size;
		});

	const { width, height } = layout(dag);

	svg
		.attr(
			'viewBox',
			`${-DIAGRAM_MARGIN} ${-DIAGRAM_MARGIN} ${width + 2 * DIAGRAM_MARGIN} ${height + 2 * DIAGRAM_MARGIN}`,
		)
		.attr('width', width + 2 * DIAGRAM_MARGIN)
		.attr('height', height + 2 * DIAGRAM_MARGIN);

	const nodes = svg
		.selectAll<SVGGElement, GraphNode<string, [string, string]>>('g.node')
		.data(dag.nodes())
		.enter()
		.append('g')
		.attr('class', (d) => {
			const override = nodeOverrideMap.get(String(d.data));
			return override?.className ? `node ${override.className}` : 'node';
		})
		.attr('transform', (d) => `translate(${d.x}, ${d.y})`)
		.each(function (d) {
			const override = nodeOverrideMap.get(String(d.data));
			if (override?.fragmentIndex !== undefined) {
				this.setAttribute('data-fragment-index', String(override.fragmentIndex));
			}
		});

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
		.selectAll('path.link')
		.data([...dag.links()])
		.enter()
		.append('path')
		.attr('class', (d) => {
			const key = edgeKey(String(d.source.data), String(d.target.data));
			const classes = edgeClassMap.get(key);
			return classes ? `link ${classes}` : 'link';
		})
		.attr('marker-end', `url(#${markerId})`)
		.attr('d', (d) => edgePath(d.source, d.target, sizeMap))
		.each(function (d) {
			const key = edgeKey(String(d.source.data), String(d.target.data));
			const fragmentIndex = edgeFragmentIndexMap.get(key);
			if (fragmentIndex !== undefined) {
				this.setAttribute('data-fragment-index', String(fragmentIndex));
			}
		});
};

const renderCausalDiagramBySelector = (
	slides: HTMLElement,
	figureSelector: string,
	edges: readonly CausalEdge[],
	nodeOverrides?: readonly CausalNodeOverride[],
): void => {
	const figure = slides.querySelector(figureSelector);
	if (!figure) return;
	const markerId = `arrow-end-${figureSelector.replace(/[^a-zA-Z0-9-_]/g, '-')}`;
	renderCausalDiagram(figure, markerId, edges, nodeOverrides);
};


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
		renderCausalDiagramBySelector(
			slides,
			'#causal-diagram-example',
			[
				{ source: 'Smoking', target: 'Cancer', className: 'fragment conditioned', fragmentIndex: 2 },
				{ source: 'Smoking', target: 'Stained Teeth', className: 'fragment conditioned', fragmentIndex: 1 },
			],
			[
				{ label: 'Stained Teeth', className: 'fragment conditioned', fragmentIndex: 0 },
			],
		);
		renderCausalDiagramBySelector(
			slides,
			'#causal-diagram-example-do',
			[
				{ source: 'Smoking', target: 'Cancer' },
				{ source: 'Smoking', target: 'Stained Teeth', className: 'fragment fade-out', fragmentIndex: 1 },
			],
			[
				{ label: 'Stained Teeth', className: 'fragment intervened', fragmentIndex: 0 },
			],
		);
	}

	deck.layout();
});
