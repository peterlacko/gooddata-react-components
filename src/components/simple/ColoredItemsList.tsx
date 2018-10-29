// (C) 2007-2018 GoodData Corporation
import * as React from 'react';
import * as PropTypes from 'prop-types';
// import InvertableList from '@gooddata/goodstrap/lib/List/InvertableList';

import { DropdownBody } from '@gooddata/goodstrap/lib/Dropdown/Dropdown';
import DataSource from '@gooddata/goodstrap/lib/data/DataSource';
import DataSourceWrapper from '@gooddata/goodstrap/lib/data/DataSourceWrapper';

import * as classNames from 'classnames';

import { ColoredItem } from './ColoredItem';

export const VISIBLE_ITEMS_COUNT = 5;
export const LIMIT = 50;
// const INITIAL_OFFSET = 0;
// const ITEM_HEIGHT = 28;
// const LIST_WIDTH = 208;
// const MAX_SELECTION_SIZE = 1;

// const getDefaultListLoading = (_listError: any, { intl }: { intl: InjectedIntl }) => {
//     const text = intl.formatMessage({ id: 'gs.list.loading' });
//     return <div><span className="s-attribute-filter-list-loading" /> {text}</div>;
// };

// const getDefaultListError = (_listError: any, { intl }: { intl: InjectedIntl }) => {
//     const text = intl.formatMessage({ id: 'gs.list.error' });
//     return <div className="gd-message error">{text}</div>;
// };

// const getDefaultListNoResults = (_listError: any, { intl }: { intl: InjectedIntl }) => {
//     const text = intl.formatMessage({ id: 'gs.list.noItemsFound' });
//     return <div>{text}</div>;
// };

export interface IColoredItemsListItem {
    name: string;
    localIdentifier: string;
    color: string;
}

export interface IColoredItemsListProps {
    inputItems: IColoredItemsListItem[];
    getListItem?: Function;
    getListLoading?: Function;
    getListError?: Function;
    getListNoResults?: Function;
}

export interface IColoredItemsListState {
    items: IColoredItemsListItem[];
    selectedItemIdentifier: string;
    isListReady: boolean;
    isListInitialising: boolean;
    listError?: any;
    filterError?: any;
    searchString?: string;
    totalCount?: any;
}

export class ColoredItemsList
    extends React.PureComponent<IColoredItemsListProps, IColoredItemsListState> {
    public static propTypes = {
        inputItems: PropTypes.array.isRequired,
        getListItem: PropTypes.func
    };

    public static defaultProps = {
    };

    private dataSource: any;

    constructor(props: IColoredItemsListProps) {
        super(props);

        this.state = {
            items: [],
            isListInitialising: false,
            isListReady: false,
            listError: null,
            searchString: '',
            selectedItemIdentifier: ''
        };
    }

    public componentWillReceiveProps(nextProps: IColoredItemsListProps) {
        if (nextProps.inputItems !== this.props.inputItems) {
            this.setupDataSource(nextProps.inputItems);
        }
    }

    public componentDidMount() {
        this.setupDataSource(this.props.inputItems);
    }

    public render() {
        const { selectedItemIdentifier } = this.state
        const classes = classNames(
            'gd-colored-items-list'
        );

        if (!this.dataSource) {
            return null;
        }

        return (
            <DataSourceWrapper dataSource={this.dataSource}>
                <DropdownBody
                    width={150}
                    rowItem={<ColoredItem onSelect={this.onSelect} selectedItemIdentifier={selectedItemIdentifier}/>}
                    className={classes}
                    maxVisibleItemsCount={VISIBLE_ITEMS_COUNT}
                />
            </DataSourceWrapper>
        );
    }

    private getColoredItems(inputItems: IColoredItemsListItem[], query: any) {
        const {
            itemsPerPage,
            page,
            searchString
        } = query;

        const begin = page * itemsPerPage;
        const end = begin + itemsPerPage;

        const filteredItems = inputItems.filter(item => item.name.includes(searchString));
        const items = filteredItems.slice(begin, end);
        return Promise.resolve({
            totalCount: filteredItems.length,
            items,
            page
        });
    }

    private setupDataSource(items: IColoredItemsListItem[]) {
        const requestHandler = this.getColoredItems.bind(this, items);

        this.setState({
            isListInitialising: true,
            listError: null
        });

        this.dataSource = new DataSource({
            requestHandler,
            itemsPerPage: 5
        });
    }

    private onSelect = (selection: IColoredItemsListItem) => {
        console.log(selection);
        this.setState({
            selectedItemIdentifier: selection.localIdentifier
        });
    }
}
