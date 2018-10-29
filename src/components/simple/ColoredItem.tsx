// (C) 2007-2018 GoodData Corporation
import * as React from 'react';
import * as PropTypes from 'prop-types';
import * as classNames from 'classnames';
// import Dropdown, { DropdownButton } from '@gooddata/goodstrap/lib/Dropdown/Dropdown';

export interface ISource {
    name: string;
    uri?: string;
    localIdentifier: string;
    empty?: boolean;
    color: string;
}

export interface IColoredItem {
    isSelected?: boolean;
    isHovered?: boolean;
    // source: ISource;
    name: string;
    uri?: string;
    localIdentifier: string;
    empty?: boolean;
    color: string;
}

export interface IColoredItemProps {
    classname?: string;
    item?: IColoredItem;
    onSelect?: (source: ISource) => void;
    selectedItemIdentifier: string;
}

export class ColoredItem extends React.PureComponent<IColoredItemProps> {
    public static propTypes = {
        classname: PropTypes.string,
        selectedItemIdentifier: PropTypes.string,
        item: PropTypes.shape({
            isSelected: PropTypes.bool,
            isHovered: PropTypes.bool,
            onColorChange: PropTypes.func,
            name: PropTypes.string,
            uri: PropTypes.string,
            localIdentifier: PropTypes.string,
            empty: PropTypes.bool,
            color: PropTypes.string
            // source: PropTypes.shape({
            //     name: PropTypes.string,
            //     uri: PropTypes.string,
            //     localIdentifier: PropTypes.string,
            //     empty: PropTypes.bool,
            //     color: PropTypes.string
            // })
        })
    };

    public static defaultProps: Partial<IColoredItemProps> = {
        item: null,
        classname: ''
    };

    public render() {
        const { item, selectedItemIdentifier } = this.props;

        if (!item) {
            return this.renderLoadingItem();
        }

        const classes = classNames(
            'gd-list-item',
            's-colored-items-list-item',
            {
                'is-selected': item.localIdentifier === selectedItemIdentifier
            }
        );
        const buttonClasses = classNames('gd-color-item-sample');
        return (
            <div className={classes} onClick={this.handleClick}>
                <input
                    className={buttonClasses}
                    style={{ background: item.color, width: '25px', height: '25px' }}
                    type="button"
                    disabled={true}
                />
                <span>{item.name}</span>
            </div>
        );
    }

    private renderLoadingItem() {
        return (
            <div className="gd-list-item gd-list-item-not-loaded" />
        );
    }

    private handleClick = () => {
        const { item, onSelect } = this.props;
        if (onSelect) {
            onSelect(item);
        }
    }
}
