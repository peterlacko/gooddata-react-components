// (C) 2007-2018 GoodData Corporation
import { Execution } from '@gooddata/typings';
import { IMappingHeader } from '../interfaces/Config';

function isAttributeHeader(headerItem: IMappingHeader): headerItem is Execution.IResultAttributeHeaderItem {
    return (headerItem as Execution.IResultAttributeHeaderItem).attributeHeaderItem !== undefined;
}

function isMeasureHeader(headerItem: IMappingHeader): headerItem is Execution.IMeasureHeaderItem {
    return (headerItem as Execution.IMeasureHeaderItem).measureHeaderItem !== undefined;
}

export function getAttributeItemNamePredicate(name: string) {
    return (headerItem: IMappingHeader) => {
        return isAttributeHeader(headerItem)
            ? headerItem.attributeHeaderItem && (headerItem.attributeHeaderItem.name === name)
            : false;
    };
}

export function getAttributeItemUriPredicate(uri: string) {
    return (headerItem: IMappingHeader) => {
        return isAttributeHeader(headerItem)
            ? headerItem.attributeHeaderItem && (headerItem.attributeHeaderItem.uri === uri)
            : false;
    };
}

export function getMeasureLocalIdentifierPredicate(localIdentifier: string) {
    return (headerItem: IMappingHeader) => {
        return isMeasureHeader(headerItem)
            ? headerItem.measureHeaderItem && (headerItem.measureHeaderItem.localIdentifier === localIdentifier)
            : false;
    };
}

export function getPredicateFromReferences(id: string, references: any) {
    return (headerItem: IMappingHeader) => {
        const uri = references[id];
        if (!uri) {
            return false;
        }

        if (isMeasureHeader(headerItem)) {
            return false;
        }

        return uri === headerItem.attributeHeaderItem.uri;
    };
}

// alternative version
export function getPredicateFromReferences2(id: string) {
    return (headerItem: IMappingHeader, references: any) => {
        const uri = references[id];
        if (!uri) {
            return false;
        }

        if (isMeasureHeader(headerItem)) {
            return false;
        }

        return uri === headerItem.attributeHeaderItem.uri;
    };
}
