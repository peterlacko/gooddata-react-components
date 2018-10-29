// (C) 2007-2018 GoodData Corporation
import * as React from 'react';
import { storiesOf } from '@storybook/react';
import { screenshotWrap } from '@gooddata/test-storybook';

import { BarChart } from '../../src';
import { onErrorHandler } from '../mocks';
import { CUSTOM_COLORS } from '../data/colors';
import {
    ATTRIBUTE_1,
    ATTRIBUTE_2,
    ATTRIBUTE_3,
    MEASURE_1,
    MEASURE_1_WITH_ALIAS,
    MEASURE_2,
    ATTRIBUTE_1_SORT_ITEM,
    MEASURE_2_SORT_ITEM,
    ARITHMETIC_MEASURE_SIMPLE_OPERANDS,
    ARITHMETIC_MEASURE_USING_ARITHMETIC,
    MEASURE_1_POP
} from '../data/componentProps';
import { GERMAN_SEPARATORS } from '../data/numberFormat';
import { CUSTOM_COLOR_PALETTE_CONFIG } from '../data/configProps';
import { ColoredItemsList } from '../../src/components/simple/ColoredItemsList';
import { IntlWrapper } from '../../src/components/core/base/IntlWrapper';

const wrapperStyle = { width: 800, height: 400 };

const item1 = {
    localIdentifier: 'm1', color: 'rgb(255,0,0)', name: 'Test measure'
};

const item2 = {
    localIdentifier: 'm2', color: 'rgb(0,255,0)', name: 'Test measure 02'
};

const item3 = {
    localIdentifier: 'm3', color: 'rgb(100,255,0)', name: 'Test measure 03'
};

const item4 = {
    localIdentifier: 'm4', color: 'rgb(200,255,0)', name: 'Test measure 04'
};

const item5 = {
    localIdentifier: 'm5', color: 'rgb(0,255,100)', name: 'Test measure 05'
};

const item6 = {
    localIdentifier: 'm6', color: 'rgb(0,255,200)', name: 'Test measure 06'
};

const item7 = {
    localIdentifier: 'm7', color: 'rgb(50,255,50)', name: 'Test measure 07'
};

let items: any[] = [item1, item2, item3, item4, item5, item6, item7];

function refreshItems({ colorMapping }: any) {
    items = colorMapping;
}

storiesOf('Core components/BarChart', module)
    .add('two measures, one attribute', () => (
        screenshotWrap(
            <div style={wrapperStyle}>
                <BarChart
                    projectId="storybook"
                    measures={[MEASURE_1, MEASURE_2]}
                    viewBy={ATTRIBUTE_1}
                    onError={onErrorHandler}
                    LoadingComponent={null}
                    ErrorComponent={null}
                />
            </div>
        )
    ))
    .add('stacked', () => (
        screenshotWrap(
            <div style={wrapperStyle}>
                <BarChart
                    projectId="storybook"
                    measures={[MEASURE_1]}
                    viewBy={ATTRIBUTE_2}
                    stackBy={ATTRIBUTE_1}
                    onError={onErrorHandler}
                    LoadingComponent={null}
                    ErrorComponent={null}
                />
            </div>
        )
    ))
    .add('one measure with alias', () => (
        screenshotWrap(
            <div style={wrapperStyle}>
                <BarChart
                    projectId="storybook"
                    measures={[MEASURE_1_WITH_ALIAS]}
                    onError={onErrorHandler}
                    LoadingComponent={null}
                    ErrorComponent={null}
                />
            </div>
        )
    ))
    .add('custom colors by palette', () => (
        screenshotWrap(
            <div style={wrapperStyle}>
                <BarChart
                    projectId="storybook"
                    measures={[MEASURE_1]}
                    viewBy={ATTRIBUTE_2}
                    stackBy={ATTRIBUTE_1}
                    config={CUSTOM_COLOR_PALETTE_CONFIG}
                    onError={onErrorHandler}
                    LoadingComponent={null}
                    ErrorComponent={null}
                />
            </div>
        )
    ))
    .add('custom colors by colors', () => (
        screenshotWrap(
            <div style={wrapperStyle}>
                <BarChart
                    projectId="storybook"
                    measures={[MEASURE_1]}
                    viewBy={ATTRIBUTE_2}
                    stackBy={ATTRIBUTE_1}
                    config={{ colors: CUSTOM_COLORS }}
                    onError={onErrorHandler}
                    LoadingComponent={null}
                    ErrorComponent={null}
                />
            </div>
        )
    ))
    .add('when both color props, prefer palette', () => (
        screenshotWrap(
            <div style={wrapperStyle}>
                <BarChart
                    projectId="storybook"
                    measures={[MEASURE_1]}
                    viewBy={ATTRIBUTE_2}
                    stackBy={ATTRIBUTE_1}
                    config={{
                        ...CUSTOM_COLOR_PALETTE_CONFIG,
                        colors: ['rgb(255, 0, 0)', 'rgb(0, 255, 0)']
                    }}
                    onError={onErrorHandler}
                    LoadingComponent={null}
                    ErrorComponent={null}
                />
            </div>
        )
    ))
    .add('sorted by attribute', () => (
        screenshotWrap(
            <div style={wrapperStyle}>
                <BarChart
                    projectId="storybook"
                    measures={[MEASURE_1, MEASURE_2]}
                    viewBy={ATTRIBUTE_1}
                    onError={onErrorHandler}
                    LoadingComponent={null}
                    ErrorComponent={null}
                    sortBy={[ATTRIBUTE_1_SORT_ITEM]}
                />
            </div>
        )
    ))
    .add('sorted by measure', () => (
        screenshotWrap(
            <div style={wrapperStyle}>
                <BarChart
                    projectId="storybook"
                    measures={[MEASURE_1, MEASURE_2]}
                    viewBy={ATTRIBUTE_1}
                    onError={onErrorHandler}
                    LoadingComponent={null}
                    ErrorComponent={null}
                    sortBy={[MEASURE_2_SORT_ITEM]}
                />
            </div>
        )
    ))
    .add('with German number format', () => (
        screenshotWrap(
            <div style={wrapperStyle}>
                <BarChart
                    projectId="storybook"
                    measures={[MEASURE_1, MEASURE_2]}
                    viewBy={ATTRIBUTE_1}
                    config={GERMAN_SEPARATORS}
                    onError={onErrorHandler}
                    LoadingComponent={null}
                    ErrorComponent={null}
                />
            </div>
        )
    ))
    .add('with dataLabels explicitly hidden', () => (
        screenshotWrap(
            <div style={wrapperStyle}>
                <BarChart
                    projectId="storybook"
                    measures={[MEASURE_1, MEASURE_2]}
                    viewBy={ATTRIBUTE_1}
                    config={{
                        dataLabels: {
                            visible: false
                        }
                    }}
                    onError={onErrorHandler}
                    LoadingComponent={null}
                    ErrorComponent={null}
                />
            </div>
        )
    ))
    .add('with disabled legend', () => (
        screenshotWrap(
            <div style={wrapperStyle}>
                <BarChart
                    projectId="storybook"
                    measures={[MEASURE_1, MEASURE_2]}
                    viewBy={ATTRIBUTE_1}
                    config={{
                        legend: {
                            enabled: false
                        }
                    }}
                    onError={onErrorHandler}
                    LoadingComponent={null}
                    ErrorComponent={null}
                />
            </div>
        )
    ))
    .add('with min max config', () => (
        screenshotWrap(
            <div style={wrapperStyle}>
                <BarChart
                    projectId="storybook"
                    measures={[MEASURE_1, MEASURE_2]}
                    viewBy={ATTRIBUTE_1}
                    onError={onErrorHandler}
                    LoadingComponent={null}
                    ErrorComponent={null}
                    config={{
                        xaxis: {
                            min: '100',
                            max: '600'
                        }
                    }}
                />
            </div>
        )
    ))
    .add('with different legend positions', () => (
        screenshotWrap(
            <div>
                <div className="storybook-title">default = auto</div>
                <div style={wrapperStyle} className="screenshot-container">
                    <BarChart
                        projectId="storybook"
                        measures={[MEASURE_1, MEASURE_2]}
                        viewBy={ATTRIBUTE_1}
                        config={{
                            legend: {
                                position: 'auto'
                            }
                        }}
                        onError={onErrorHandler}
                        LoadingComponent={null}
                        ErrorComponent={null}
                    />
                </div>
                <div className="storybook-title">left</div>
                <div style={wrapperStyle} className="screenshot-container">
                    <BarChart
                        projectId="storybook"
                        measures={[MEASURE_1, MEASURE_2]}
                        viewBy={ATTRIBUTE_1}
                        config={{
                            legend: {
                                position: 'left'
                            }
                        }}
                        onError={onErrorHandler}
                        LoadingComponent={null}
                        ErrorComponent={null}
                    />
                </div>
                <div className="storybook-title">top</div>
                <div style={wrapperStyle} className="screenshot-container">
                    <BarChart
                        projectId="storybook"
                        measures={[MEASURE_1, MEASURE_2]}
                        viewBy={ATTRIBUTE_1}
                        config={{
                            legend: {
                                position: 'top'
                            }
                        }}
                        onError={onErrorHandler}
                        LoadingComponent={null}
                        ErrorComponent={null}
                    />
                </div>
                <div className="storybook-title">right</div>
                <div style={wrapperStyle} className="screenshot-container">
                    <BarChart
                        projectId="storybook"
                        measures={[MEASURE_1, MEASURE_2]}
                        viewBy={ATTRIBUTE_1}
                        config={{
                            legend: {
                                position: 'right'
                            }
                        }}
                        onError={onErrorHandler}
                        LoadingComponent={null}
                        ErrorComponent={null}
                    />
                </div>
                <div className="storybook-title">bottom</div>
                <div style={wrapperStyle} className="screenshot-container">
                    <BarChart
                        projectId="storybook"
                        measures={[MEASURE_1, MEASURE_2]}
                        viewBy={ATTRIBUTE_1}
                        config={{
                            legend: {
                                position: 'bottom'
                            }
                        }}
                        onError={onErrorHandler}
                        LoadingComponent={null}
                        ErrorComponent={null}
                    />
                </div>
            </div>
        )
    ))
    .add('arithmetic measures', () => (
        screenshotWrap(
            <div style={wrapperStyle}>
                <BarChart
                    projectId="storybook"
                    measures={[
                        MEASURE_1,
                        MEASURE_2,
                        ARITHMETIC_MEASURE_SIMPLE_OPERANDS,
                        ARITHMETIC_MEASURE_USING_ARITHMETIC
                    ]}
                    viewBy={ATTRIBUTE_1}
                    onError={onErrorHandler}
                    LoadingComponent={null}
                    ErrorComponent={null}
                />
            </div>
        )
    ))
    .add('one measure, one attribute, with color mapping', () => (
        <div style={wrapperStyle}>
            <BarChart
                projectId="storybook"
                measures={[MEASURE_1, MEASURE_2, MEASURE_1_POP]}
                viewBy={ATTRIBUTE_1}
                onError={onErrorHandler}
                LoadingComponent={null}
                ErrorComponent={null}
                config={{
                    ...CUSTOM_COLOR_PALETTE_CONFIG,
                    colorMapping: [
                        {
                            id: 'm1',
                            color: {
                                type: 'guid',
                                value: '03'
                            }
                        }, {
                            id: 'm2',
                            color: {
                                type: 'guid',
                                value: '02'
                            }
                        }, {
                            id: 'm1_pop',
                            color: {
                                type: 'rgb',
                                value: {
                                    r: 0,
                                    g: 0,
                                    b: 0
                                }
                            }
                        }
                    ]
                }}
            />
        </div>
    ))
    .add('stacked with color mapping', () => (
        <div style={wrapperStyle}>
            <IntlWrapper locale="en-US">
                <ColoredItemsList inputItems={items} />
            </IntlWrapper>
            <BarChart
                projectId="storybook"
                measures={[MEASURE_1]}
                viewBy={ATTRIBUTE_2}
                stackBy={ATTRIBUTE_3}
                onError={onErrorHandler}
                LoadingComponent={null}
                ErrorComponent={null}
                pushData={refreshItems}
                config={{
                    ...CUSTOM_COLOR_PALETTE_CONFIG,
                    colorMapping: [
                        {
                            id: 'rep3',
                            color: {
                                type: 'guid',
                                value: '02'
                            }
                        }, {
                            id: 'rep4',
                            color: {
                                type: 'guid',
                                value: '02'
                            }
                        }, {
                            id: 'rep10',
                            color: {
                                type: 'rgb',
                                value: {
                                    r: 0,
                                    g: 0,
                                    b: 0
                                }
                            }
                        }
                    ]
                }}
            />
        </div>
    ));
