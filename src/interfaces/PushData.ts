// (C) 2007-2018 GoodData Corporation
import { AFM, Execution, VisualizationObject } from '@gooddata/typings';
import { IColorMap, IColorPalette } from '../components/visualizations/chart/Chart';

export interface IPushData {
    result?: Execution.IExecutionResponses;
    properties?: {
        sortItems?: AFM.SortItem[];
        totals?: VisualizationObject.IVisualizationTotal[];
    };
    propertiesMeta?: any;
    colors?: {
        colorMapping: IColorMap[];
        colorPalette: IColorPalette;
    };
}
