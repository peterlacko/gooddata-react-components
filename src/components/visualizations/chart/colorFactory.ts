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
    IReferences
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
        colorAssignment: IColorAssignment[],
        measureGroup: MeasureGroupType,
        viewByAttribute: any,
        stackByAttribute: any,
        afm: AFM.IAfm
    ): IColorMap[];
}

const emptyColorPaletteItem: IGuidColorItem = { type: 'guid', value: 'none' };

function getColorFromMapping(references: IReferences, colorAssignment: IColorAssignment[]
    ): IColorItem {
        if (!colorAssignment) {
            return undefined;
        }

        const mapping = colorAssignment.find(item => item.predicate(references));
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
        const colorMap = this.mapColorsFromMeasures(measureGroup, afm, colorAssignment, colorPalette);
        return this.mapColorsFromDerivedMeasure(measureGroup, afm, colorMap, colorPalette);
    }

    private mapColorsFromMeasures(
        measureGroup: MeasureGroupType,
        afm: AFM.IAfm,
        colorAssignment: IColorAssignment[],
        colorPalette: IColorPalette
    ): IColorMap[] {
        let currentColorPaletteIndex = 0;

        const colorMap = measureGroup.items.map((item, index) => {
            const { localIdentifier } = item.measureHeaderItem;

            if (isDerivedMeasure(measureGroup.items[index], afm)) {
                return {
                    id: localIdentifier,
                    color: emptyColorPaletteItem
                };
            }

            const mappedMeasure: IColorMap = this.mapMeasureColor(
                localIdentifier,
                currentColorPaletteIndex,
                index,
                measureGroup,
                colorPalette,
                colorAssignment
            );

            currentColorPaletteIndex++;

            return mappedMeasure;

        });

        return colorMap;
    }

    private mapMeasureColor(
        measureHeaderItem: Execution.IMeasureHeaderItem,
        currentColorPaletteIndex: number,
        measureItemIndex: number,
        measureGroup: MeasureGroupType,
        colorPalette: IColorPalette,
        colorAssignment: IColorAssignment[]
    ): IColorMap {
        const mappedColor = getColorFromMapping(measureHeaderItem, colorAssignment);
        const { localIdentifier } = measureHeaderItem.measureHeaderItem;

        const color: IColorItem = mappedColor ? mappedColor :
            {
                type: 'guid',
                value: colorPalette[currentColorPaletteIndex % colorPalette.length].guid
            };

        return {
            id: localIdentifier,
            name: measureGroup.items[measureItemIndex].measureHeaderItem.name,
            color
        };
    }

    private mapColorsFromDerivedMeasure(
        measureGroup: MeasureGroupType,
        afm: AFM.IAfm,
        colorMap: IColorMap[],
        colorPalette: IColorPalette
    ): IColorMap[] {
        return colorMap.map((colorMapItem, measureItemIndex) => {
            if (!isDerivedMeasure(measureGroup.items[measureItemIndex], afm)) {
                return colorMapItem;
            }
            const parentMeasureIndex = findParentMeasureIndex(afm, measureItemIndex);
            if (parentMeasureIndex > -1) {
                const sourceMeasureColor = colorMap[parentMeasureIndex].color;
                return {
                    ...colorMapItem,
                    color: {
                        type: 'rgb' as RGBType,
                        value: sourceMeasureColor.type === 'guid'
                        ? getLighterColorFromRGB(getColorByGuid(colorPalette, sourceMeasureColor.value as string), 0.6)
                        : getLighterColorFromRGB(sourceMeasureColor.value as IRGBColor, 0.6)
                    }
                };
            }
            return {
                ...colorMapItem,
                color: colorMapItem.color
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
    return attribute.items.map((item: any) => {
        const uri = item.attributeHeaderItem.uri;
        const name = item.attributeHeaderItem.name;
        const mappedColor = getColorFromMapping({ uri }, colorAssignment);

        const color = mappedColor ? mappedColor
            : {
                type: 'guid',
                value: colorPalette[currentColorPaletteIndex % colorPalette.length].guid
            };
        currentColorPaletteIndex++;

        return {
            name,
            id: uri,
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
        const localIdentifier = measureGroup && measureGroup.items[0].measureHeaderItem.localIdentifier;
        if (colorAssignment) {
            mappedColor = getColorFromMapping({ localIdentifier }, colorAssignment);
            if (mappedColor) {
                return [{
                    id: localIdentifier,
                    name: measureGroup.items[0].measureHeaderItem.name,
                    color: mappedColor
                }];
            }
        }

        if (colorPalette && isCustomPalette(colorPalette) && colorPalette[0]) {
            return [{
                id: localIdentifier,
                name: measureGroup.items[0].measureHeaderItem.name,
                color: {
                    type: 'guid',
                    value: colorPalette[0].guid
                }
            }];
        }

        return [{
            id: localIdentifier,
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
        colorAssignment: IColorAssignment[],
        measureGroup: MeasureGroupType,
        viewByAttribute: any,
        stackByAttribute: any,
        afm: AFM.IAfm
    ): IColorMap[] {

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
