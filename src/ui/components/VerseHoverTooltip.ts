import type { ResolvedVersePreview } from "../../services/VersePreviewService";

let activeTooltipEl: HTMLElement | null = null;
let hideTimeout: number | null = null;

export type VerseTooltipAnchor = Pick<DOMRect, "top" | "bottom" | "left" | "width">;

export function createVersePreviewTooltipElement(preview: ResolvedVersePreview): HTMLElement {
	const tooltip = document.createElement("div");
	tooltip.className = "open-bible-verse-hover-popover";

	const header = document.createElement("div");
	header.className = "open-bible-verse-hover-header";
	header.textContent = `${preview.reference} (${preview.versionAbbr})`;
	tooltip.appendChild(header);

	const versesContainer = document.createElement("div");
	versesContainer.className = "open-bible-verse-hover-body";
	for (const v of preview.verses) {
		const row = document.createElement("div");
		row.className = "open-bible-verse-hover-row";
		const num = document.createElement("span");
		num.className = "open-bible-verse-hover-num";
		num.textContent = `${v.number} `;
		const txt = document.createElement("span");
		txt.className = "open-bible-verse-hover-txt";
		txt.textContent = v.text;
		row.appendChild(num);
		row.appendChild(txt);
		versesContainer.appendChild(row);
	}
	tooltip.appendChild(versesContainer);

	return tooltip;
}

function positionVerseTooltip(tooltip: HTMLElement, anchor: VerseTooltipAnchor): void {
	const tooltipRect = tooltip.getBoundingClientRect();
	const margin = 16;
	const gap = 8;
	const spaceBelow = window.innerHeight - anchor.bottom - margin;
	const spaceAbove = anchor.top - margin;

	let top: number;
	if (spaceBelow >= tooltipRect.height + gap || spaceBelow >= spaceAbove) {
		top = anchor.bottom + gap;
	} else {
		top = anchor.top - tooltipRect.height - gap;
	}

	let left = anchor.left + anchor.width / 2 - tooltipRect.width / 2;
	if (left < margin) left = margin;
	if (left + tooltipRect.width > window.innerWidth - margin) {
		left = window.innerWidth - tooltipRect.width - margin;
	}
	if (top < margin) top = margin;
	if (top + tooltipRect.height > window.innerHeight - margin) {
		top = window.innerHeight - tooltipRect.height - margin;
	}

	tooltip.style.top = `${top}px`;
	tooltip.style.left = `${left}px`;
}

export function showVerseTooltipAtRect(
	anchor: VerseTooltipAnchor,
	preview: ResolvedVersePreview
): void {
	if (hideTimeout) {
		window.clearTimeout(hideTimeout);
		hideTimeout = null;
	}

	hideVerseTooltip();

	const tooltip = createVersePreviewTooltipElement(preview);
	document.body.appendChild(tooltip);
	activeTooltipEl = tooltip;
	positionVerseTooltip(tooltip, anchor);

	tooltip.addEventListener("mouseenter", () => {
		if (hideTimeout) {
			window.clearTimeout(hideTimeout);
			hideTimeout = null;
		}
	});
	tooltip.addEventListener("mouseleave", () => {
		scheduleHideVerseTooltip();
	});
}

export function showVerseTooltip(
	targetEl: HTMLElement,
	preview: ResolvedVersePreview
): void {
	showVerseTooltipAtRect(targetEl.getBoundingClientRect(), preview);
}

export function scheduleHideVerseTooltip(delay = 250): void {
	if (hideTimeout) {
		window.clearTimeout(hideTimeout);
	}
	hideTimeout = window.setTimeout(() => {
		hideVerseTooltip();
	}, delay);
}

export function hideVerseTooltip(): void {
	if (hideTimeout) {
		window.clearTimeout(hideTimeout);
		hideTimeout = null;
	}
	if (activeTooltipEl) {
		activeTooltipEl.remove();
		activeTooltipEl = null;
	}
}

export function isVerseTooltipActive(): boolean {
	return activeTooltipEl !== null;
}
