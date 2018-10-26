// (C) 2007-2018 GoodData Corporation
import { AFM, Execution } from '@gooddata/typings';
import range = require('lodash/range');

import {
    DEFAULT_COLOR_PALETTE,
    HEATMAP_BLUE_COLOR_PALETTE,
    getLighterColor,
    normalizeColorToRGB,
    getRgbString,
    isCustomPalette
} from '../utils/color';

import {
    isHeatmap,
    isOneOfTypes,
    isTreemap
} from '../utils/common';

import { VisualizationTypes } from '../../../constants/visualizationTypes';

import {
    isDerivedMeasure,
    findParentMeasureIndex
} from './chartOptionsBuilder';
import { IColorPalette, IColorPaletteItem, IColorMap, IRGBColor } from './Chart';

export interface IColorStrategy {
    getColorByIndex(index: number): string;
    getColorMapping(): IColorFullMapItem[];
}
export interface IColorFullMapItem {
    name?: string;
    localIdentifier?: string;
    guid?: string;
    color: string;
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
    protected palette: IColorFullMapItem[];
    constructor(
        colorPalette: IColorPalette,
        colorMapping: IColorMap[],
        measureGroup: MeasureGroupType,
        viewByAttribute: any,
        stackByAttribute: any,
        afm: AFM.IAfm
    ) {
        this.palette = this.createPalette(
            colorPalette,
            colorMapping,
            measureGroup,
            viewByAttribute,
            stackByAttribute,
            afm);
    }

    public getColorByIndex(index: number): string {
        return this.palette[index] && this.palette[index].color;
    }

    public getColorMapping() {
        return this.palette;
    }

    protected abstract createPalette(
        colorPalette: IColorPalette,
        colorMapping: IColorMap[],
        measureGroup: MeasureGroupType,
        viewByAttribute: any,
        stackByAttribute: any,
        afm: AFM.IAfm
    ): IColorFullMapItem[];
}
const emptyColorPaletteItem = { guid: 'none', fill: { r: 0, g: 0, b: 0 } };

function getColorFromMapping(itemId: string, colorPalette: IColorPalette, colorMapping: IColorMap[]
    ): IColorPaletteItem {
        if (!colorMapping) {
            return undefined;
        }

        const colorMap = colorMapping.find(item => item.id === itemId);
        if (colorMap === undefined) {
            return undefined;
        }

        if (colorMap.color.type === 'guid') {
            return colorPalette.find(colorPaletteItem => colorPaletteItem.guid === colorMap.color.value);
        } else {
            return {
                guid: String(Math.floor(Math.random() * 10000)),
                fill: colorMap.color.value as IRGBColor
            };
        }
}

export class MeasureColorStrategy extends ColorStrategy {
    protected createPalette(
        colorPalette: IColorPalette,
        colorMapping: IColorMap[],
        measureGroup: MeasureGroupType,
        _viewByAttribute: any,
        _stackByAttribute: any,
        afm: AFM.IAfm
    ): IColorFullMapItem[] {
        let currentColorPaletteIndex = 0;

        const paletteMeasures = range(measureGroup.items.length).map((measureItemIndex) => {
            const itemId = measureGroup.items[measureItemIndex].measureHeaderItem.localIdentifier;
            if (isDerivedMeasure(measureGroup.items[measureItemIndex], afm)) {
                return {
                    localIdentifier: itemId,
                    color: emptyColorPaletteItem
                };
            }

            const mappedColor = getColorFromMapping(itemId, colorPalette, colorMapping);

            const color = mappedColor ? mappedColor : colorPalette[currentColorPaletteIndex % colorPalette.length];
            currentColorPaletteIndex++;

            return {
                color,
                localIdentifier: itemId,
                guid: color.guid,
                name: measureGroup.items[measureItemIndex].measureHeaderItem.name
            };
        });

        return paletteMeasures.map((colorConfig, measureItemIndex) => {
            if (!isDerivedMeasure(measureGroup.items[measureItemIndex], afm)) {
                return {
                    ...colorConfig,
                    color: getRgbString(colorConfig.color)
                };
            }
            const parentMeasureIndex = findParentMeasureIndex(afm, measureItemIndex);
            if (parentMeasureIndex > -1) {
                const sourceMeasureColor = paletteMeasures[parentMeasureIndex].color;
                return {
                    ...colorConfig,
                    color: getLighterColor(normalizeColorToRGB(getRgbString(sourceMeasureColor)), 0.6)
                };
            }
            return {
                ...colorConfig,
                color: getRgbString(colorConfig.color)
            };
        });
    }
}

function getAttributeColorMapping(attribute: any, colorPalette: IColorPalette, colorMapping: IColorMap[]) {
    const itemsCount = attribute.items.length;
    let currentColorPaletteIndex = 0;
    return range(itemsCount).map((itemIndex) => {
        const itemId = attribute.items[itemIndex].attributeHeaderItem.name;
        const mappedColor = getColorFromMapping(itemId, colorPalette, colorMapping);

        const color = mappedColor ? mappedColor : colorPalette[currentColorPaletteIndex % colorPalette.length];
        currentColorPaletteIndex++;

        return {
            name: itemId,
            localIdentifier: itemId,
            guid: color.guid,
            color: getRgbString(color)
        };
    });
}

export class AttributeColorStrategy extends ColorStrategy {
    protected createPalette(
        colorPalette: IColorPalette,
        colorMapping: IColorMap[],
        _measureGroup: MeasureGroupType,
        viewByAttribute: any,
        stackByAttribute: any,
        _afm: AFM.IAfm
    ): IColorFullMapItem[] {
        const attribute = stackByAttribute ? stackByAttribute : viewByAttribute;
        return getAttributeColorMapping(attribute, colorPalette, colorMapping);
    }
}

export class HeatmapColorStrategy extends ColorStrategy {
    public getColorByIndex(index: number): string {
        return this.palette[index % this.palette.length].color;
    }

    protected createPalette(
        colorPalette: IColorPalette,
        colorMapping: IColorMap[],
        measureGroup: MeasureGroupType,
        _viewByAttribute: any,
        _stackByAttribute: any,
        _afm: AFM.IAfm
    ): IColorFullMapItem[] {
        let mappedColor;
        if (colorMapping) {
            const measureId = measureGroup.items[0].measureHeaderItem.localIdentifier;
            mappedColor = getColorFromMapping(measureId, colorPalette, colorMapping);
            if (mappedColor) {
                return this.getCustomHeatmapColorPalette(mappedColor).map(color => ({ color }));
            }
        }

        if (colorPalette && isCustomPalette(colorPalette) && colorPalette[0]) {
            return this.getCustomHeatmapColorPalette(colorPalette[0]).map(color => ({ color }));
        }

        return HEATMAP_BLUE_COLOR_PALETTE.map((color) => {
            return {
                color
            };
        });
    }

    private getCustomHeatmapColorPalette(baseColor: IColorPaletteItem): HighChartColorPalette {
        const { r, g, b } = baseColor.fill;
        const colorItemsCount = 6;
        const channels = [r, g, b];
        const steps = channels.map(channel => (255 - channel) / colorItemsCount);
        const generatedColors = this.getCalculatedColors(colorItemsCount, channels, steps);
        return [
            'rgb(255,255,255)',
            ...generatedColors.reverse(),
            getRgbString(baseColor)
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
    protected createPalette(
        colorPalette: IColorPalette,
        colorMapping: IColorMap[],
        measureGroup: MeasureGroupType,
        viewByAttribute: any,
        stackByAttribute: any,
        afm: AFM.IAfm
    ): IColorFullMapItem[] {
        if (viewByAttribute) {
            return getAttributeColorMapping(viewByAttribute, colorPalette, colorMapping);
        }
        return super.createPalette(
            colorPalette,
            colorMapping,
            measureGroup,
            viewByAttribute,
            stackByAttribute,
            afm
        );
    }
}

export function isAttributeColorPalette(type: string, afm: AFM.IAfm, stackByAttribute: any) {
    const attributeChartSupported = isOneOfTypes(type, attributeChartSupportedTypes);
    return stackByAttribute || (attributeChartSupported && afm.attributes && afm.attributes.length > 0);
}

export class ColorFactory {
    public static getColorStrategy(
        colorPalette: IColorPalette = DEFAULT_COLOR_PALETTE,
        colorMapping: IColorMap[],
        measureGroup: MeasureGroupType,
        viewByAttribute: any,
        stackByAttribute: any,
        afm: AFM.IAfm,
        type: string
    ): IColorStrategy {

        if (isHeatmap(type)) {
            return new HeatmapColorStrategy(
                colorPalette,
                colorMapping,
                measureGroup,
                viewByAttribute,
                stackByAttribute,
                afm);
        }

        if (isTreemap(type)) {
            return new TreemapColorStrategy(
                colorPalette,
                colorMapping,
                measureGroup,
                viewByAttribute,
                stackByAttribute,
                afm);
        }

        if (isAttributeColorPalette(type, afm, stackByAttribute)) {
            return new AttributeColorStrategy(
                colorPalette,
                colorMapping,
                measureGroup,
                viewByAttribute,
                stackByAttribute,
                afm);
        }

        return new MeasureColorStrategy(
            colorPalette,
            colorMapping,
            measureGroup,
            viewByAttribute,
            stackByAttribute,
            afm);
    }
}
