import { Platform, setIcon, type Modal } from "obsidian";
import type { UiButtonSize, UiButtonVariant } from "./types";

export function uiButtonClass(variant: UiButtonVariant = "default", size: UiButtonSize = "md"): string {
	const classes = ["open-bible-ui-btn"];
	if (variant === "cta") classes.push("mod-cta");
	if (variant === "warning") classes.push("mod-warning");
	if (variant === "ghost") classes.push("is-ghost");
	if (size === "sm") classes.push("is-small");
	return classes.join(" ");
}

export function setupOpenBibleDialog(
	modal: Modal,
	options?: { drawerOnMobile?: boolean }
): void {
	modal.contentEl.addClass("open-bible-ui-dialog");
	modal.modalEl.addClass("open-bible-ui-modal");
	if (options?.drawerOnMobile && Platform.isMobile) {
		modal.modalEl.addClass("open-bible-mobile-drawer");
		if (!modal.contentEl.querySelector(".open-bible-drawer-handle")) {
			modal.contentEl.prepend(modal.contentEl.createDiv("open-bible-drawer-handle"));
		}
	}
}

export function createUiDialogBody(parent: HTMLElement): HTMLElement {
	return parent.createDiv({ cls: "open-bible-ui-dialog-body" });
}

export function createUiFooter(parent: HTMLElement): HTMLElement {
	return parent.createDiv({ cls: "open-bible-ui-footer" });
}

export function createUiButton(
	parent: HTMLElement,
	options: {
		text: string;
		variant?: UiButtonVariant;
		size?: UiButtonSize;
		icon?: string;
		onClick: (event: MouseEvent) => void;
	}
): HTMLButtonElement {
	const button = parent.createEl("button", {
		cls: uiButtonClass(options.variant, options.size),
	});
	if (options.icon) {
		const iconEl = button.createSpan({ cls: "open-bible-ui-btn__icon" });
		setIcon(iconEl, options.icon);
	}
	button.createSpan({ text: options.text });
	button.addEventListener("click", options.onClick);
	return button;
}
