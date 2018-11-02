// (C) 2007-2018 GoodData Corporation
import { AFM, Execution } from '@gooddata/typings';
import range = require('lodash/range');

import {
    DEFAULT_COLOR_PALETTE,
    HEATMAP_BLUE_COLOR_PALETTE,
    getLighterColorFromRGB,
    isCustomPalette
} from '../utils/color';

import {
    isHeatmap,
    isOneOfTypes,
    isTreemap,
    isScatterPlot
} from '../utils/common';

import { VisualizationTypes } from '../../../constants/visualizationTypes';

import {
    isDerivedMeasure,
    findParentMeasureIndex
} from './chartOptionsBuilder';

import {
    IColorPalette,
    IColorMap,
    IColorAssignment,
    IRGBColor,
    IGuidColorItem,
    RGBType,
    IColorItem,
    IMappingHeader
} from './Chart';

export interface IColorStrategy {
    getColorByIndex(index: number): string;
    getColorMapping(): IColorMap[];
}

export type HighChartColorPalette = string[];
export type MeasureGroupType = Execution.IMeasureGroupHeader['measureGroupHeader'];
export const attributeChartSupportedTypes = [
    VisualizationTypes.PIE,
    VisualizationTypes.DONUT,
    VisualizationTypes.FUNNEL,
    VisualizationTypes.SCATTER,
    VisualizationTypes.BUBBLE
];

export abstract class ColorStrategy implements IColorStrategy {
    protected palette: string[];
    protected colorMapping: IColorMap[];
    constructor(
        colorPalette: IColorPalette,
        colorAssignment: IColorAssignment[],
        measureGroup: MeasureGroupType,
        viewByAttribute: any,
        stackByAttribute: any,
        afm: AFM.IAfm
    ) {
        this.colorMapping = this.createColorMapping(
            colorPalette,
            colorAssignment,
            measureGroup,
            viewByAttribute,
            stackByAttribute,
            afm
        );

        this.palette = this.createPalette(colorPalette, this.colorMapping, viewByAttribute);
    }

    public getColorByIndex(index: number): string {
        return this.palette[index];
    }

    public getColorMapping() {
        return this.colorMapping;
    }

    protected createPalette(colorPalette: IColorPalette, colorMapping: IColorMap[], _viewByAttribute: any): string[] {
        return colorMapping.map((map) => {
            const color = map.color.type === 'guid'
                ? getColorByGuid(colorPalette, map.color.value as string) : map.color.value as IRGBColor;
            return getRgbStringFromRGB(color);
        });
    }

    protected abstract createColorMapping(
        colorPalette: IColorPalette,
        colorAssignment: IColorAssignment[],
        measureGroup: MeasureGroupType,
        viewByAttribute: any,
        stackByAttribute: any,
        afm: AFM.IAfm
    ): IColorMap[];
}

const emptyColorPaletteItem: IGuidColorItem = { type: 'guid', value: 'none' };

function getColorFromMapping(mappingHeader: IMappingHeader, colorAssignment: IColorAssignment[]
    ): IColorItem {
        if (!colorAssignment) {
            return undefined;
        }

        const mapping = colorAssignment.find(item => item.predicate(mappingHeader));
        return mapping && mapping.color;
}

function getColorByGuid(colorPalette: IColorPalette, guid: string) {
    return colorPalette.find(item => item.guid === guid).fill;
}

function getRgbStringFromRGB(color: IRGBColor) {
    return `rgb(${color.r},${color.g},${color.b})`;
}

export class MeasureColorStrategy extends ColorStrategy {
    protected createColorMapping(
        colorPalette: IColorPalette,
        colorAssignment: IColorAssignment[],
        measureGroup: MeasureGroupType,
        _viewByAttribute: any,
        _stackByAttribute: any,
        afm: AFM.IAfm
    ): IColorMap[] {
        const measuresColorMapping = this.mapColorsFromMeasures(measureGroup, afm, colorAssignment, colorPalette);
        return this.mapColorsFromDerivedMeasure(measureGroup, afm, measuresColorMapping, colorPalette);
    }

    private mapColorsFromMeasures(
        measureGroup: MeasureGroupType,
        afm: AFM.IAfm,
        colorAssignment: IColorAssignment[],
        colorPalette: IColorPalette
    ): IColorMap[] {
        let currentColorPaletteIndex = 0;

        const colorMap = measureGroup.items.map((headerItem, index) => {
            if (isDerivedMeasure(measureGroup.items[index], afm)) {
                return {
                    headerItem,
                    color: emptyColorPaletteItem
                };
            }

            const mappedMeasure: IColorMap = this.mapMeasureColor(
                headerItem,
                currentColorPaletteIndex,
                colorPalette,
                colorAssignment
            );

            currentColorPaletteIndex++;

            return mappedMeasure;

        });

        return colorMap;
    }

    private mapMeasureColor(
        headerItem: Execution.IMeasureHeaderItem,
        currentColorPaletteIndex: number,
        colorPalette: IColorPalette,
        colorAssignment: IColorAssignment[]
    ): IColorMap {
        const mappedColor = getColorFromMapping(headerItem, colorAssignment);

        const color: IColorItem = mappedColor ? mappedColor :
            {
                type: 'guid',
                value: colorPalette[currentColorPaletteIndex % colorPalette.length].guid
            };

        return {
            headerItem,
            color
        };
    }

    private mapColorsFromDerivedMeasure(
        measureGroup: MeasureGroupType,
        afm: AFM.IAfm,
        measuresColorMapping: IColorMap[],
        colorPalette: IColorPalette
    ): IColorMap[] {
        return measuresColorMapping.map((mapItem, measureItemIndex) => {
            if (!isDerivedMeasure(measureGroup.items[measureItemIndex], afm)) {
                return mapItem;
            }
            const parentMeasureIndex = findParentMeasureIndex(afm, measureItemIndex);
            if (parentMeasureIndex > -1) {
                const sourceMeasureColor = measuresColorMapping[parentMeasureIndex].color;
                const rgbColor = sourceMeasureColor.type === 'guid'
                    ? getColorByGuid(colorPalette, sourceMeasureColor.value as string)
                    : sourceMeasureColor.value as IRGBColor;
                return {
                    ...mapItem,
                    color: {
                        type: 'rgb' as RGBType,
                        value: getLighterColorFromRGB(rgbColor, 0.6)
                    }
                };
            }
            return {
                ...mapItem,
                color: mapItem.color
            };
        });
    }
}

function getAttributeColorMapping(
        attribute: any,
        colorPalette: IColorPalette,
        colorAssignment: IColorAssignment[]
    ): IColorMap[] {
    let currentColorPaletteIndex = 0;
    return attribute.items.map((headerItem: any) => {
        const mappedColor = getColorFromMapping(headerItem, colorAssignment);

        const color = mappedColor ? mappedColor
            : {
                type: 'guid',
                value: colorPalette[currentColorPaletteIndex % colorPalette.length].guid
            };
        currentColorPaletteIndex++;

        return {
            headerItem,
            color
        };
    });
}

export class AttributeColorStrategy extends ColorStrategy {
    protected createColorMapping(
        colorPalette: IColorPalette,
        colorAssignment: IColorAssignment[],
        _measureGroup: MeasureGroupType,
        viewByAttribute: any,
        stackByAttribute: any,
        _afm: AFM.IAfm
    ): IColorMap[] {
        const attribute = stackByAttribute ? stackByAttribute : viewByAttribute;
        return getAttributeColorMapping(attribute, colorPalette, colorAssignment);
    }
}

export class HeatmapColorStrategy extends ColorStrategy {
    public getColorByIndex(index: number): string {
        return this.palette[index % this.palette.length];
    }

    protected createColorMapping(
        colorPalette: IColorPalette,
        colorAssignment: IColorAssignment[],
        measureGroup: MeasureGroupType,
        _viewByAttribute: any,
        _stackByAttribute: any,
        _afm: AFM.IAfm
    ): IColorMap[] {
        let mappedColor;
        const headerItem = measureGroup && measureGroup.items[0];
        if (colorAssignment) {
            mappedColor = getColorFromMapping(headerItem, colorAssignment);
            if (mappedColor) {
                return [{
                    headerItem,
                    color: mappedColor
                }];
            }
        }

        if (colorPalette && isCustomPalette(colorPalette) && colorPalette[0]) {
            return [{
                headerItem,
                color: {
                    type: 'guid',
                    value: colorPalette[0].guid
                }
            }];
        }

        return [{
            headerItem,
            color: {
                type: 'guid',
                value: 'HEATMAP_DEFAULT'
            }
        }];
    }

    protected createPalette(
        colorPalette: IColorPalette,
        colorMapping: IColorMap[]
    ): string[] {
        if (colorMapping[0].color.type === 'guid') {
            if (colorMapping[0].color.value === 'HEATMAP_DEFAULT') {
                return HEATMAP_BLUE_COLOR_PALETTE;
            }

            return this.getCustomHeatmapColorPalette(
                getColorByGuid(colorPalette, colorMapping[0].color.value as string)
            );
        }

        return this.getCustomHeatmapColorPalette(colorMapping[0].color.value as IRGBColor);
    }

    private getCustomHeatmapColorPalette(baseColor: IRGBColor): HighChartColorPalette {
        const { r, g, b } = baseColor;
        const colorItemsCount = 6;
        const channels = [r, g, b];
        const steps = channels.map(channel => (255 - channel) / colorItemsCount);
        const generatedColors = this.getCalculatedColors(colorItemsCount, channels, steps);
        return [
            'rgb(255,255,255)',
            ...generatedColors.reverse(),
            getRgbStringFromRGB(baseColor)
        ];
    }
    private getCalculatedColors(count: number, channels: number[], steps: number[]): HighChartColorPalette {
        return range(1, count)
            .map((index: number) =>
                `rgb(${this.getCalculatedChannel(channels[0], index, steps[0])},` +
                    `${this.getCalculatedChannel(channels[1], index, steps[1])},` +
                    `${this.getCalculatedChannel(channels[2], index, steps[2])})`);
    }

    private getCalculatedChannel(channel: number, index: number, step: number): number {
        return Math.trunc(channel + index * step);
    }
}

export class TreemapColorStrategy extends MeasureColorStrategy {
    protected createColorMapping(
        colorPalette: IColorPalette,
        colorAssignment: IColorAssignment[],
        measureGroup: MeasureGroupType,
        viewByAttribute: any,
        stackByAttribute: any,
        afm: AFM.IAfm
    ): IColorMap[] {
        if (viewByAttribute) {
            return getAttributeColorMapping(viewByAttribute, colorPalette, colorAssignment);
        }

        return super.createColorMapping(
            colorPalette,
            colorAssignment,
            measureGroup,
            viewByAttribute,
            stackByAttribute,
            afm
        );
    }
}

export class ScatterPlotColorStrategy extends MeasureColorStrategy {
    protected createColorMapping(
        colorPalette: IColorPalette,
        colorAssignment: IColorAssignment[],
        measureGroup: MeasureGroupType,
        _viewByAttribute: any,
        _stackByAttribute: any,
        _afm: AFM.IAfm
    ): IColorMap[] {
        const measureHeaderItem = measureGroup.items[0];
        const colorMapping = getColorFromMapping(measureHeaderItem, colorAssignment);
        const color: IColorItem = colorMapping ? colorMapping : { type: 'guid', value: colorPalette[0].guid };
        return [{
            headerItem: measureHeaderItem,
            color
        }];
    }

    protected createPalette(colorPalette: IColorPalette, colorMapping: IColorMap[], viewByAttribute: any): string[] {
        const length = viewByAttribute ? viewByAttribute.items.length : 1;
        const color = colorMapping[0].color.type === 'guid'
            ? getColorByGuid(colorPalette, colorMapping[0].color.value as string)
            : colorMapping[0].color.value as IRGBColor;
        return range(length).map(() => {
            return getRgbStringFromRGB(color);
        });
    }
}

export function isAttributeColorPalette(type: string, afm: AFM.IAfm, stackByAttribute: any) {
    const attributeChartSupported = isOneOfTypes(type, attributeChartSupportedTypes);
    return stackByAttribute || (attributeChartSupported && afm.attributes && afm.attributes.length > 0);
}

export class ColorFactory {
    public static getColorStrategy(
        colorPalette: IColorPalette = DEFAULT_COLOR_PALETTE,
        colorAssignment: IColorAssignment[],
        measureGroup: MeasureGroupType,
        viewByAttribute: any,
        stackByAttribute: any,
        afm: AFM.IAfm,
        type: string
    ): IColorStrategy {

        if (isHeatmap(type)) {
            return new HeatmapColorStrategy(
                colorPalette,
                colorAssignment,
                measureGroup,
                viewByAttribute,
                stackByAttribute,
                afm);
        }

        if (isTreemap(type)) {
            return new TreemapColorStrategy(
                colorPalette,
                colorAssignment,
                measureGroup,
                viewByAttribute,
                stackByAttribute,
                afm);
        }

        if (isScatterPlot(type)) {
            return new ScatterPlotColorStrategy(
                colorPalette,
                colorAssignment,
                measureGroup,
                viewByAttribute,
                stackByAttribute,
                afm);
        }

        if (isAttributeColorPalette(type, afm, stackByAttribute)) {
            return new AttributeColorStrategy(
                colorPalette,
                colorAssignment,
                measureGroup,
                viewByAttribute,
                stackByAttribute,
                afm);
        }

        return new MeasureColorStrategy(
            colorPalette,
            colorAssignment,
            measureGroup,
            viewByAttribute,
            stackByAttribute,
            afm);
    }
}
