import { GenericComponent, functor, ChartCanvasContext } from "@ivanmatiaspascual/core";
import { ScaleContinuousNumeric } from "d3-scale";
import * as React from "react";

export interface LabelProps {
    readonly datum?: any;
    readonly fillStyle?: string | ((datum: any) => string);
    readonly fontFamily?: string;
    readonly fontSize?: number;
    readonly fontWeight?: string;
    readonly rotate?: number;
    readonly selectCanvas?: (canvases: any) => any;
    readonly text?: string | ((datum: any) => string);
    readonly textAlign?: CanvasTextAlign;
    readonly x:
        | number
        | ((xScale: ScaleContinuousNumeric<number, number>, xAccessor: any, datum: any, plotData: any[]) => number);
    readonly xAccessor?: (datum: any) => any;
    readonly xScale?: ScaleContinuousNumeric<number, number>;
    readonly y: number | ((yScale: ScaleContinuousNumeric<number, number>, datum: any, plotData: any[]) => number);
    readonly yScale?: ScaleContinuousNumeric<number, number>;
    readonly leading?: number;
}

export class Label extends React.Component<LabelProps> {
    public static defaultProps = {
        fontFamily: "-apple-system, system-ui, Roboto, 'Helvetica Neue', Ubuntu, sans-serif",
        fontSize: 64,
        fontWeight: "bold",
        fillStyle: "#dcdcdc",
        rotate: 0,
        x: ({ xScale, xAccessor, datum }: any) => xScale(xAccessor(datum)),
        selectCanvas: (canvases: any) => canvases.bg,
        leading: 16,
    };

    public static contextType = ChartCanvasContext;

    public render() {
        const { selectCanvas } = this.props;

        return <GenericComponent canvasToDraw={selectCanvas} canvasDraw={this.drawOnCanvas} drawOn={[]} />;
    }

    private readonly drawOnCanvas = (ctx: CanvasRenderingContext2D, moreProps: any) => {
        const previousTransformationMatrix = ctx.getTransform();

        const { textAlign = "center", fontFamily, fontSize, fontWeight, rotate, leading } = this.props;

        const { canvasOriginX, canvasOriginY, margin, ratio } = this.context;

        ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transformation matrix
        ctx.scale(ratio, ratio);

        if (canvasOriginX !== undefined) {
            ctx.translate(canvasOriginX, canvasOriginY);
        } else {
            ctx.translate(margin.left + 0.5 * ratio, margin.top + 0.5 * ratio);
        }

        const { xScale, chartConfig, xAccessor } = moreProps;

        const yScale = Array.isArray(chartConfig) || !chartConfig ? undefined : chartConfig.yScale;

        const { xPos, yPos, fillStyle, text } = this.helper(moreProps, xAccessor, xScale, yScale);

        ctx.translate(xPos, yPos);
        if (rotate !== undefined) {
            const radians = (rotate / 180) * Math.PI;

            ctx.rotate(radians);
        }

        const previousFont = ctx.font;
        if (fontFamily !== undefined) {
            ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
        }
        const previousFillStyle = ctx.fillStyle;
        if (fillStyle !== undefined) {
            ctx.fillStyle = fillStyle;
        }
        const previousTextAlign = ctx.textAlign;
        if (textAlign !== undefined) {
            ctx.textAlign = textAlign;
        }

        ctx.beginPath();
        let texts: string[] = [];
        if (text) {
            texts = text.split("\n");
        }
        const x = 0;
        let y = 0;
        let offset = 0;
        if (fontSize !== undefined) {
            offset += fontSize;
        }
        if (leading !== undefined) {
            offset += leading;
        }
        for (let i = 0; i < texts.length; i++) {
            const text = texts[i];
            ctx.fillText(text, x, y);
            y += offset;
        }

        // Restore
        ctx.setTransform(previousTransformationMatrix);
        ctx.font = previousFont;
        ctx.fillStyle = previousFillStyle;
        ctx.textAlign = previousTextAlign;
    };

    private readonly helper = (
        moreProps: any,
        xAccessor: any,
        xScale: ScaleContinuousNumeric<number, number>,
        yScale: ScaleContinuousNumeric<number, number>,
    ): {
        xPos: number;
        yPos: number;
        text: string | undefined;
        fillStyle: string | undefined;
    } => {
        const { x, y, datum, fillStyle, text } = this.props;

        const { plotData } = moreProps;

        const xFunc = functor(x);
        const yFunc = functor(y);

        const [xPos, yPos] = [xFunc({ xScale, xAccessor, datum, plotData }), yFunc({ yScale, datum, plotData })];

        return {
            xPos,
            yPos,
            text: functor(text)(datum),
            fillStyle: functor(fillStyle)(datum),
        };
    };
}
