// (C) 2007-2018 GoodData Corporation
import range = require('lodash/range');
import get = require('lodash/get');
import head = require('lodash/head');
import last = require('lodash/last');

import { IHeatmapLegendItem } from '../../typings/legend';
import { RIGHT, TOP, BOTTOM } from './PositionTypes';
import { formatLegendLabel } from '../../utils/common';

export const RESPONSIVE_ITEM_MIN_WIDTH = 200;
export const RESPONSIVE_VISIBLE_ROWS = 2;
export const FLUID_PAGING_WIDTH = 30;
export const LEGEND_PADDING = 12;
export const ITEM_HEIGHT = 20;
export const SKIPPED_LABEL_TEXT = '...';
export const UTF_NON_BREAKING_SPACE = '\u00A0';
const STATIC_PAGING_HEIGHT = 44;

export interface IHeatmapLegendBox {
    class: string;
    key: string;
    style: {
        backgroundColor: string;
        border: string
    };
}

export interface IHeatmapLegendLabel {
    class: string;
    key: string;
    label: string;
}

export interface IHeatmapLegendConfig {
    boxes: IHeatmapLegendBox[];
    classes: string[];
    labels: IHeatmapLegendLabel[];
    position: string;
}

export function calculateFluidLegend(seriesCount: number, containerWidth: number) {
    // -1 because flex dimensions provide rounded number and the real width can be float
    const realWidth = containerWidth - (2 * LEGEND_PADDING) - 1;

    if (seriesCount <= 2) {
        return {
            hasPaging: false,
            itemWidth: realWidth / seriesCount,
            visibleItemsCount: seriesCount
        };
    }

    let columnsCount = Math.floor(realWidth / RESPONSIVE_ITEM_MIN_WIDTH);
    let itemWidth = realWidth / columnsCount;
    let hasPaging = false;

    const rowsCount = Math.ceil(seriesCount / columnsCount);

    // Recalculate with paging
    if (rowsCount > RESPONSIVE_VISIBLE_ROWS) {
        const legendWidthWithPaging = realWidth - FLUID_PAGING_WIDTH;
        columnsCount = Math.floor(
            legendWidthWithPaging / RESPONSIVE_ITEM_MIN_WIDTH
        );
        itemWidth = legendWidthWithPaging / columnsCount;
        hasPaging = true;
    }

    const visibleItemsCount = columnsCount * RESPONSIVE_VISIBLE_ROWS;

    return {
        itemWidth,
        hasPaging,
        visibleItemsCount
    };
}

function getStaticVisibleItemsCount(containerHeight: number, withPaging: boolean = false) {
    const pagingHeight = withPaging ? STATIC_PAGING_HEIGHT : 0;
    return Math.floor((containerHeight - pagingHeight) / ITEM_HEIGHT);
}

export function calculateStaticLegend(seriesCount: number, containerHeight: number) {
    const visibleItemsCount = getStaticVisibleItemsCount(containerHeight);
    if (visibleItemsCount >= seriesCount) {
        return {
            hasPaging: false,
            visibleItemsCount
        };
    }
    return {
        hasPaging: true,
        visibleItemsCount: getStaticVisibleItemsCount(containerHeight, true)
    };
}

function getHeatmapLegendLabels(series: IHeatmapLegendItem[], format: string, numericSymbols: string[]) {
    const min = get(head(series), 'range.from', 0);
    const max = get(last(series), 'range.to', 0);
    const diff = max - min;

    return range(series.length + 1).map((index) => {
        let value;

        if (index === 0) {
            value = get(series, '0.range.from', 0);
        } else if (index === series.length) {
            value = get(series, `${index - 1}.range.to`, 0);
        } else {
            value = get(series, `${index}.range.from`, 0);
        }

        return formatLegendLabel(value, format, diff, numericSymbols);
    });
}

function getShortenedHeatmapLabels(legendLabels: string[]): IHeatmapLegendLabel[] {
    const selectedLabels = [
        legendLabels[0],
        SKIPPED_LABEL_TEXT,
        legendLabels[2],
        SKIPPED_LABEL_TEXT,
        UTF_NON_BREAKING_SPACE,
        SKIPPED_LABEL_TEXT,
        legendLabels[5],
        SKIPPED_LABEL_TEXT,
        legendLabels[7]
    ];

    return selectedLabels.map((label, index) => {
        let positionClass;

        if (index === 0) {
            positionClass = 'left';
        } else if (index === selectedLabels.length - 1) {
            positionClass = 'right';
        } else if ([2, 6].includes(index)) {
            positionClass = 'middle';
        } else if (index === 4) {
            positionClass = 'center-empty';
        } else {
            positionClass = 'dots';
        }

        return {
            class: positionClass,
            key: `label-${index}`,
            label
        };
    });
}

function getNormalHeatmapLabels(legendLabels: string[]): IHeatmapLegendLabel[] {
    return legendLabels.reduce((acc: IHeatmapLegendLabel[], label: string, index: number) => {
        let positionClass;

        if (index === 0) {
            positionClass = 'left';
        } else if (index === legendLabels.length - 1) {
            positionClass = 'right';
        } else {
            positionClass = [3, 4].includes(index) ? 'middle' : 'center';
        }

        acc.push({
            class: positionClass,
            key: `label-${index}`,
            label
        });

        if (index > 0 && index < 6) {
            acc.push({
                class: 'empty',
                key: `empty-${index}`,
                label: UTF_NON_BREAKING_SPACE
            });
        }

        return acc;
    }, []);
}

const LABEL_LENGHT_THRESHOLDS = [4, 7];
const SMALL_LABEL_LENGHT_THRESHOLDS = [3, 6];

function getLabelsShorteningConfig(legendLabels: string[], isSmall: boolean, position: string) {
    const firstLabelLength = head(legendLabels).length;
    const lastLabelLength = last(legendLabels).length;
    const maxLabelLength = firstLabelLength > lastLabelLength ? firstLabelLength : lastLabelLength;

    const thresholds = isSmall ? SMALL_LABEL_LENGHT_THRESHOLDS : LABEL_LENGHT_THRESHOLDS;
    let shortenClass;
    let shouldShorten;

    if (maxLabelLength <= thresholds[0]) {
        shortenClass = '';
        shouldShorten = false;
    } else if (maxLabelLength > thresholds[0] && maxLabelLength <= thresholds[1]) {
        shortenClass = 'shortened-medium';
        shouldShorten = true;
    } else {
        shortenClass = 'shortened-full';
        shouldShorten = true;
    }

    shortenClass = position === TOP || position === BOTTOM ? shortenClass : '';

    return {
        shortenClass,
        shouldShorten
    };
}

const MIDDLE_LEGEND_BOX_INDEX = 3;

function getHeatmapBoxes(series: IHeatmapLegendItem[]): IHeatmapLegendBox[] {
    const getBoxStyle = (item: IHeatmapLegendItem) => ({
        backgroundColor: item.color,
        border: item.color === 'rgb(255,255,255)' ? '1px solid #ccc' : 'none'
    });

    return series.map((item: IHeatmapLegendItem, index: number) => {
        const style = getBoxStyle(item);
        const middle = index === MIDDLE_LEGEND_BOX_INDEX ? 'middle' : null;

        return {
            class: middle,
            key: `item-${index}`,
            style
        };
    });
}

export function getHeatmapLegendConfiguration(
    series: IHeatmapLegendItem[], format: string, numericSymbols: string[], isSmall: boolean, position: string
): IHeatmapLegendConfig {
    const legendLabels = getHeatmapLegendLabels(series, format, numericSymbols);
    const small = isSmall ? 'small' : null;

    let finalPosition;

    // tslint:disable-next-line:prefer-conditional-expression
    if (isSmall) {
        finalPosition = position === TOP ? TOP : BOTTOM;
    } else {
        finalPosition = position || RIGHT;
    }

    const shorteningConfig = getLabelsShorteningConfig(legendLabels, isSmall, finalPosition);
    const classes = ['viz-legend', 'heatmap-legend', `position-${finalPosition}`, small, shorteningConfig.shortenClass];

    // legend has *always* 7 boxes, 8 numeric labels when labels fit, 4 otherwise
    const finalLabels = shorteningConfig.shouldShorten
        ? getShortenedHeatmapLabels(legendLabels) : getNormalHeatmapLabels(legendLabels);

    const boxes = getHeatmapBoxes(series);

    return {
        classes,
        labels: finalLabels,
        boxes,
        position: finalPosition
    };
}
