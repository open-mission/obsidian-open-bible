export function portal(node: HTMLElement) {
	const doc = node.ownerDocument ?? activeDocument ?? document;
	doc.body.appendChild(node);
	return {
		destroy() {
			if (node.parentNode) {
				node.parentNode.removeChild(node);
			}
		},
	};
}
