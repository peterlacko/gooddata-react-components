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
    isTreemap
} from '../utils/common';

import { VisualizationTypes } from '../../../constants/visualizationTypes';

import {
    isDerivedMeasure,
    findParentMeasureIndex
} from './chartOptionsBuilder';
import { IColorPalette, IColorMap, IRGBColor, IPaletteColor, IRGBMapColor, RGBType } from './Chart';

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
        colorMapping: IColorMap[],
        measureGroup: MeasureGroupType,
        viewByAttribute: any,
        stackByAttribute: any,
        afm: AFM.IAfm
    ) {
        this.colorMapping = this.createColorMapping(
            colorPalette,
            colorMapping,
            measureGroup,
            viewByAttribute,
            stackByAttribute,
            afm
        );

        this.palette = this.createPalette(colorPalette, this.colorMapping);
    }

    public getColorByIndex(index: number): string {
        return this.palette[index];
    }

    public getColorMapping() {
        return this.colorMapping;
    }

    protected createPalette(colorPalette: IColorPalette, colorMapping: IColorMap[]): string[] {
        return colorMapping.map((map) => {
            const color = map.color.type === 'guid'
                ? getColorByGuid(colorPalette, map.color.value as string) : map.color.value as IRGBColor;
            return getRgbStringFromRGB(color);
        });
    }

    protected abstract createColorMapping(
        colorPalette: IColorPalette,
        colorMapping: IColorMap[],
        measureGroup: MeasureGroupType,
        viewByAttribute: any,
        stackByAttribute: any,
        afm: AFM.IAfm
    ): IColorMap[];
}

const emptyColorPaletteItem = { type: 'guid', value: 'none' };

function getColorFromMapping(itemId: string, colorMapping: IColorMap[]
    ): IPaletteColor | IRGBMapColor {
        if (!colorMapping) {
            return undefined;
        }

        const mapping = colorMapping.find(item => item.id === itemId);
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
        colorMapping: IColorMap[],
        measureGroup: MeasureGroupType,
        _viewByAttribute: any,
        _stackByAttribute: any,
        afm: AFM.IAfm
    ): IColorMap[] {
        let currentColorPaletteIndex = 0;

        const paletteMeasures = range(measureGroup.items.length).map((measureItemIndex) => {
            const itemId = measureGroup.items[measureItemIndex].measureHeaderItem.localIdentifier;
            if (isDerivedMeasure(measureGroup.items[measureItemIndex], afm)) {
                return {
                    id: itemId,
                    color: emptyColorPaletteItem
                };
            }

            const mappedColor = getColorFromMapping(itemId, colorMapping);

            const color = mappedColor ? mappedColor :
                {
                    type: 'guid',
                    value: colorPalette[currentColorPaletteIndex % colorPalette.length].guid
                };
            currentColorPaletteIndex++;

            return {
                id: itemId,
                name: measureGroup.items[measureItemIndex].measureHeaderItem.name,
                color
            };
        });

        return paletteMeasures.map((colorConfig, measureItemIndex) => {
            if (!isDerivedMeasure(measureGroup.items[measureItemIndex], afm)) {
                return colorConfig;
            }
            const parentMeasureIndex = findParentMeasureIndex(afm, measureItemIndex);
            if (parentMeasureIndex > -1) {
                const sourceMeasureColor = paletteMeasures[parentMeasureIndex].color;
                return {
                    ...colorConfig,
                    color: {
                        type: 'rgb' as RGBType,
                        value: sourceMeasureColor.type === 'guid'
                        ? getLighterColorFromRGB(getColorByGuid(colorPalette, sourceMeasureColor.value as string), 0.6)
                        : getLighterColorFromRGB(sourceMeasureColor.value as IRGBColor, 0.6)
                    }
                };
            }
            return {
                ...colorConfig,
                color: colorConfig.color
            };
        });
    }
}

function getAttributeColorMapping(attribute: any, colorPalette: IColorPalette, colorMapping: IColorMap[]): IColorMap[] {
    let currentColorPaletteIndex = 0;
    return attribute.items.map((item: any) => {
        const itemId = item.attributeHeaderItem.name;
        const mappedColor = getColorFromMapping(itemId, colorMapping);

        const color = mappedColor ? mappedColor
            : {
                type: 'guid',
                value: colorPalette[currentColorPaletteIndex % colorPalette.length].guid
            };
        currentColorPaletteIndex++;

        return {
            name: itemId,
            id: itemId,
            color
        };
    });
}

export class AttributeColorStrategy extends ColorStrategy {
    protected createColorMapping(
        colorPalette: IColorPalette,
        colorMapping: IColorMap[],
        _measureGroup: MeasureGroupType,
        viewByAttribute: any,
        stackByAttribute: any,
        _afm: AFM.IAfm
    ): IColorMap[] {
        const attribute = stackByAttribute ? stackByAttribute : viewByAttribute;
        return getAttributeColorMapping(attribute, colorPalette, colorMapping);
    }
}

export class HeatmapColorStrategy extends ColorStrategy {
    public getColorByIndex(index: number): string {
        return this.palette[index % this.palette.length];
    }

    protected createColorMapping(
        colorPalette: IColorPalette,
        colorMapping: IColorMap[],
        measureGroup: MeasureGroupType,
        _viewByAttribute: any,
        _stackByAttribute: any,
        _afm: AFM.IAfm
    ): IColorMap[] {
        let mappedColor;
        const measureId = measureGroup && measureGroup.items[0].measureHeaderItem.localIdentifier;
        if (colorMapping) {
            mappedColor = getColorFromMapping(measureId, colorMapping);
            if (mappedColor) {
                return [{
                    id: measureId,
                    name: measureGroup.items[0].measureHeaderItem.name,
                    color: mappedColor
                }];
            }
        }

        if (colorPalette && isCustomPalette(colorPalette) && colorPalette[0]) {
            return [{
                id: measureId,
                name: measureGroup.items[0].measureHeaderItem.name,
                color: {
                    type: 'guid',
                    value: colorPalette[0].guid
                }
            }];
        }

        return [{
            id: measureId,
            name: measureGroup && measureGroup.items[0].measureHeaderItem.name,
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
        colorMapping: IColorMap[],
        measureGroup: MeasureGroupType,
        viewByAttribute: any,
        stackByAttribute: any,
        afm: AFM.IAfm
    ): IColorMap[] {
        if (viewByAttribute) {
            return getAttributeColorMapping(viewByAttribute, colorPalette, colorMapping);
        }
        return super.createColorMapping(
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
