// (C) 2007-2018 GoodData Corporation
import isEqual = require('lodash/isEqual');
import noop = require('lodash/noop');
import * as React from 'react';
import { VisualizationObject, Execution } from '@gooddata/typings';
import { initChartPlugins } from './highcharts/chartPlugins';
import { VisType } from '../../../constants/visualizationTypes';
import { IDataLabelsConfig } from '../../../interfaces/Config';
import { ISeparators } from '@gooddata/numberjs';
import { PositionType } from '../typings/legend';

// Have only one entrypoint to highcharts and drill module
// tslint:disable-next-line
export const HighchartsMore = require('highcharts/highcharts-more');
export const Highcharts = require('highcharts/highcharts'); // tslint:disable-line
const drillmodule = require('highcharts/modules/drilldown'); // tslint:disable-line
const treemapModule = require('highcharts/modules/treemap'); // tslint:disable-line
const funnelModule = require('highcharts/modules/funnel'); // tslint:disable-line
const heatmap = require('highcharts/modules/heatmap'); // tslint:disable-line
const patternFill = require('highcharts-pattern-fill'); // tslint:disable-line

drillmodule(Highcharts);
treemapModule(Highcharts);
funnelModule(Highcharts);
heatmap(Highcharts);
HighchartsMore(Highcharts);
patternFill(Highcharts);
initChartPlugins(Highcharts);

export interface ILegendConfig {
    enabled?: boolean;
    position?: PositionType;
    responsive?: boolean;
}

export interface IChartLimits {
    series?: number;
    categories?: number;
    dataPoints?: number;
}

export type GuidType = 'guid';
export type RGBType = 'rgb';

export interface IRGBColor {
    r: number;
    g: number;
    b: number;
}

export interface IGuidColorItem {
    type: GuidType;
    value: string;
}

export interface IRGBColorItem {
    type: RGBType;
    value: IRGBColor;
}

export type IColorItem = IGuidColorItem | IRGBColorItem;

export type IMappingHeader = Execution.IResultAttributeHeaderItem | Execution.IMeasureHeaderItem;

export type ColorAssignmentPredicate = (mappingHeader: IMappingHeader) => boolean;

export interface IColorAssignment { // < send to SDK
    predicate: ColorAssignmentPredicate;
    color: IColorItem;
}

export interface IColorMap { // send from SDK using pushData
    headerItem: IMappingHeader;
    color: IColorItem;
}

export interface IChartConfig {
    colors?: string[];
    colorPalette?: IColorPalette;
    colorAssignment?: IColorAssignment[];
    type?: VisType;
    legend?: ILegendConfig;
    legendLayout?: string;
    limits?: IChartLimits;
    stacking?: boolean;
    grid?: any;
    mdObject?: VisualizationObject.IVisualizationObjectContent;
    yFormat?: string;
    yLabel?: string;
    xLabel?: string;
    xFormat?: string;
    chart?: any;
    xaxis?: IAxisConfig;
    yaxis?: IAxisConfig;
    separators?: ISeparators;
    dataLabels?: IDataLabelsConfig;
}

export interface IAxisConfig {
    visible?: boolean;
    labelsEnabled?: boolean;
    rotation?: string;
    min?: string;
    max?: string;
}

export interface IChartProps {
    config: IChartConfig;
    domProps: any;
    callback(): void;
}

export interface IColorPaletteItem {
    guid: string;
    fill: IRGBColor;
}

export type IFind = (item: IColorPaletteItem) => boolean;

export interface IColorPalette {
    [index: number]: IColorPaletteItem;
    length: number;
    find(fun: IFind): IColorPaletteItem;
}

export default class Chart extends React.Component<IChartProps> {
    public static defaultProps: Partial<IChartProps> = {
        callback: noop,
        domProps: {}
    };

    private chart: Highcharts.ChartObject;
    private chartRef: HTMLElement;

    public constructor(props: IChartProps) {
        super(props);
        this.setChartRef = this.setChartRef.bind(this);
    }

    public componentDidMount() {
        this.createChart(this.props.config);
    }

    public shouldComponentUpdate(nextProps: IChartProps) {
        if (isEqual(this.props.config, nextProps.config)) {
            return false;
        }

        return true;
    }

    public componentDidUpdate() {
        this.createChart(this.props.config);
    }

    public componentWillUnmount() {
        this.chart.destroy();
    }

    public setChartRef(ref: HTMLElement) {
        this.chartRef = ref;
    }

    public getChart(): Highcharts.ChartObject {
        if (!this.chart) {
            throw new Error('getChart() should not be called before the component is mounted');
        }

        return this.chart;
    }

    public createChart(config: IChartConfig) {
        const chartConfig = config.chart;
        this.chart = new Highcharts.Chart(
            {
                ...config,
                chart: {
                    ...chartConfig,
                    renderTo: this.chartRef
                }
            },
            this.props.callback
        );
    }

    public render() {
        return (
            <div
                {...this.props.domProps}
                ref={this.setChartRef}
            />
        );
    }
}
