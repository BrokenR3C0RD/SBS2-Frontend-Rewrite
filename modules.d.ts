declare module '@bbob/html';
declare module '@bbob/react';

declare module '@bbob/preset' {
    import { Element } from "react";
    export type Dictionary<T> = {
        [i: string]: T
    }
    export interface Node {
        tag: string | Element;
        content: (Node | string)[];
    }
    export interface TagNode implements Node {
        tag: string | Element;
        content: (Node | string)[];
        attrs?: Dictionary<string | object>;
        length?: number;
    }
    interface Preset { }

    export default (nodes: (Dictionary<((node: TagNode) => TagNode)>)) => ((options?: any) => Preset);
}

declare module 'damerau-levenshtein' {
    interface LevenshteinResponse {
        steps: number;
        relative: number;
        similarity: number;
    }
    export = (string1: string, string2: string): LevenshteinResponse => LevenshteinResponse
}