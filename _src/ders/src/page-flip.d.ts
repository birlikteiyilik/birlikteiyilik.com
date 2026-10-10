declare module "page-flip/dist/js/page-flip.module.js" {
  export class PageFlip {
    constructor(element: HTMLElement, settings: Record<string, number | string | boolean>);
    loadFromHTML(pages: HTMLElement[]): void;
    on(event: string, callback: (event: { data: unknown }) => void): void;
    off(event: string): void;
    update(): void;
    destroy(): void;
    flipNext(corner?: "top" | "bottom"): void;
    flipPrev(corner?: "top" | "bottom"): void;
    turnToPage(index: number): void;
    getCurrentPageIndex(): number;
    getOrientation(): "portrait" | "landscape";
    getState(): "read" | "flipping" | "user_fold" | "fold_corner";
    getBoundsRect(): { pageWidth: number };
    getSettings(): { flippingTime: number; showPageCorners: boolean; useMouseEvents: boolean };
    getUI(): { getDistElement(): HTMLElement };
    startUserTouch(point: { x: number; y: number }): void;
    userMove(point: { x: number; y: number }, isTouch: boolean): void;
    userStop(point: { x: number; y: number }, isSwipe?: boolean): void;
  }
}
