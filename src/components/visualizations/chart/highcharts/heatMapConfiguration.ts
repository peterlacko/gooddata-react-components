// (C) 2007-2018 GoodData Corporation
import cloneDeep = require('lodash/cloneDeep');

const HEATMAP_TEMPLATE = {
    chart: {
        type: 'heatmap',
        marginTop: 45
    },
    colorAxis: {
        tickColor: 'rgb(255,255,255)',
        stops: [
            [0, 'rgb(255, 255, 255)'],
            [1 / 6, 'rgb(197, 236, 248)'],
            [2 / 6, 'rgb(138, 217, 241)'],
            [0.5, 'rgb(79, 198, 234)'],
            [4 / 6, 'rgb(20, 178, 226)'],
            [5 / 6, 'rgb(22, 151, 192)'],
            [1, 'rgb(0, 110, 145)']
        ]
    },
    plotOptions: {
        heatmap: {
            borderColor: 'rgb(255,255,255)'
        }
    },
    legend: {
        enabled: true,
        align: 'right',
        layout: 'horizontal',
        margin: 0,
        verticalAlign: 'top',
        y: -10,
        symbolWidth: 392,
        symbolHeight: 10
    },
    series: [{
        dataLabels: {
            color: '#000000',
            allowOverlap: false
        }
    }]
};

export function getHeatMapConfiguration() {
    return cloneDeep(HEATMAP_TEMPLATE);
}
