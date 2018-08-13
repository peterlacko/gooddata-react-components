// (C) 2007-2018 GoodData Corporation
import * as React from 'react';
import * as classNames from 'classnames';
import {
    IHeatMapLegendBox,
    IHeatMapLegendConfig,
    IHeatMapLegendSerie,
    IHeatmapLegendLabel,
    getHeatMapLegendConfiguration
} from './helpers';
import { TOP, BOTTOM } from './PositionTypes';

export interface IHeatMapLegendProps {
    series: IHeatMapLegendSerie[];
    isSmall: boolean;
    format?: string;
    numericSymbols: string[];
    position: string;
}

function HeatMapLabels(labels: IHeatmapLegendLabel[]) {
    return (
        <div className="labels">
            {labels.map((item: IHeatmapLegendLabel) => {
                return (
                    <span
                        className={item.class}
                        key={item.key}
                    >
                        {item.label}
                    </span>
                );
            })}
        </div>
    );
}

function HeatMapBoxes(boxes: IHeatMapLegendBox[]) {
    return (
        <div className="boxes">
            {boxes.map((box: IHeatMapLegendBox) => {
                const classes = classNames('box', box.class);

                return (
                    <span className={classes} key={box.key} style={box.style} />
                );
            })}
        </div>
    );
}

export default class HeatMapLegend extends React.PureComponent<IHeatMapLegendProps> {
    public render() {
        const { series, format, numericSymbols, isSmall, position } = this.props;

        const config: IHeatMapLegendConfig = getHeatMapLegendConfiguration(
            series, format, numericSymbols, isSmall, position
        );
        const classes = classNames(...config.classes);

        const renderLabelsFirst = config.position === TOP || config.position === BOTTOM;

        return (
            <div className={classes}>
                {renderLabelsFirst && HeatMapLabels(config.labels)}
                {HeatMapBoxes(config.boxes)}
                {!renderLabelsFirst && HeatMapLabels(config.labels)}
            </div>
        );
    }
}
