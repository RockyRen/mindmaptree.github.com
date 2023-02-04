import { RaphaelPaper } from 'raphael';
import PaperWrapper from './paper-wrapper';
import EventEmitter from 'eventemitter3';

export interface Viewbox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ViewportEventMap {
  changeScale: (scale: number) => void; 
}

const maxScale = 3;
const minScale = 0.25;

class Viewport {
  private readonly paper: RaphaelPaper;
  private readonly eventEmitter: EventEmitter<ViewportEventMap>;
  private readonly viewbox: Viewbox = { x: 0, y: 0, width: 0, height: 0 };
  private wrapperWidth: number;
  private wrapperHeight: number;
  public constructor(
    private readonly paperWrapper: PaperWrapper,
    private scale: number = 1,
  ) {
    this.paper = this.paperWrapper.getPaper();
    const paperSize = this.paperWrapper.getSize();
    this.wrapperWidth = paperSize.width;
    this.wrapperHeight = paperSize.height;

    this.eventEmitter = new EventEmitter<ViewportEventMap>();

    if (scale > maxScale) {
      scale = maxScale;
    } else if (scale < minScale) {
      scale = minScale;
    }
    this.setScale(scale);
  }

  public getViewbox(): Viewbox {
    return this.viewbox;
  }

  public getScale(): number {
    return this.scale;
  }

  public setScale(scale: number): void {
    if (scale > maxScale) {
      scale = maxScale;
    } else if (scale < minScale) {
      scale = minScale;
    }

    const viewbox = this.viewbox;

    viewbox.width = this.wrapperWidth / scale;
    viewbox.height = this.wrapperHeight / scale;
    viewbox.x = this.getScalePosition(this.scale, scale, viewbox.x, this.wrapperWidth);
    viewbox.y = this.getScalePosition(this.scale, scale, viewbox.y, this.wrapperHeight);
    this.scale = scale;

    this.setViewBox();
    this.eventEmitter.emit('changeScale', this.scale);
  }

  public addScale(dScale: number): void {
    const newScale = this.scale + dScale;
    this.setScale(newScale);
  }

  public on<T extends EventEmitter.EventNames<ViewportEventMap>>(
    eventName: T,
    callback: EventEmitter.EventListener<ViewportEventMap, T>
  ) {
    this.eventEmitter.on(eventName, callback);
  }

  public translate(dx: number, dy: number) {
    const viewbox = this.viewbox;
    viewbox.x = viewbox.x + (dx / this.scale);
    viewbox.y = viewbox.y + (dy / this.scale);

    this.setViewBox();
  }

  public translateTo(x: number, y: number) {
    const viewbox = this.viewbox;
    viewbox.x = x;
    viewbox.y = y;

    this.setViewBox();
  }

  public resize(width: number, height: number) {
    const viewbox = this.viewbox;
    viewbox.width = (width / this.wrapperWidth) * viewbox.width;
    viewbox.height = (height / this.wrapperHeight) * viewbox.height;

    this.setViewBox();

    this.wrapperWidth = width;
    this.wrapperHeight = height;
  }

  // 由clientX和clientY获取viewport的位置
  public getViewportPosition(clientX: number, clientY: number): {
    x: number;
    y: number;
  } {
    const wrapperDom = this.paperWrapper.getWrapperDom();
    const wrapperRect = wrapperDom.getBoundingClientRect();

    return {
      x: this.viewbox.x + (clientX - wrapperRect.x) / this.scale,
      y: this.viewbox.y + (clientY - wrapperRect.y) / this.scale,
    };
  }

  public getOffsetPosition(x: number, y: number): {
    offsetX: number;
    offsetY: number;
  } {
    return {
      offsetX: (x - this.viewbox.x) * this.scale,
      offsetY: (y - this.viewbox.y) * this.scale,
    }
  }

  private getScalePosition(oldScale: number, scale: number, oldPosition: number, wrapperSize: number) {
    return oldPosition + wrapperSize * ((1 / oldScale) - (1 / scale)) / 2;
  }

  private setViewBox(): void {
    const viewbox = this.viewbox;
    this.paper.setViewBox(viewbox.x, viewbox.y, viewbox.width, viewbox.height, true);
  }
}

export default Viewport;