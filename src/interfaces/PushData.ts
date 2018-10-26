// (C) 2007-2018 GoodData Corporation
import { AFM, Execution, VisualizationObject } from '@gooddata/typings';
import { IColorFullMapItem } from '../components/visualizations/chart/colorFactory';

export interface IPushData {
    result?: Execution.IExecutionResponses;
    properties?: {
        sortItems?: AFM.SortItem[];
        totals?: VisualizationObject.IVisualizationTotal[];
    };
    propertiesMeta?: any;
    colorMapping?: IColorFullMapItem[];
}
