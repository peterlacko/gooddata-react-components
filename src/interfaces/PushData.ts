
import { AFM, Execution, VisualizationObject } from '@gooddata/typings';

export interface IPushData {
    result?: Execution.IExecutionResponses;

    properties?: {
        sortItems?: AFM.SortItem[];
        totals?: VisualizationObject.IVisualizationTotal[];
        isUserSorting?: boolean;
    };
}
