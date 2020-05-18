/*
 * SBS2 Frontend
 * Created on Fri May 08 2020
 *
 * Copyright (c) 2020 MasterR#C0RD
 */

import { useDrag, useDrop, DragPreviewImage, ConnectDragPreview } from "react-dnd";
import { useRef, HTMLAttributes } from "react";
import { API_ENTITY } from "../../constants/ApiRoutes";
import { Preview, PreviewProps } from "react-dnd-multi-backend";

type ImageItem = { type: "image", fileID: number, idx?: number };

export default (({
    fileID,
    size,
    square = false,
    move,
    idx,
    remove,
    nodrag = false,
    ...props
}) => {
    const ref = useRef<HTMLImageElement>(null);
    let dragging, drag, dragPreview: ConnectDragPreview, drop, preview;
    if (!nodrag) {
        [{ dragging }, drag, dragPreview] = useDrag<ImageItem, unknown, { dragging: boolean }>({
            item: { type: "image", fileID, idx },
            isDragging: (monitor) => fileID === monitor.getItem().fileID,
            collect: (monitor) => ({
                dragging: monitor.isDragging()
            })
        });
        [, drop] = useDrop({
            accept: "image",
            hover: (item: ImageItem) => {
                if (!ref.current)
                    return;

                const itemIdx = item.idx;
                if (itemIdx == idx)
                    return;

                console.log(itemIdx, idx);

                move!(itemIdx!, idx!);
                item.idx = idx;
            }
        });

        drag(drop(ref));

        preview = ({ item, style }: { type: string, item: ImageItem, style: React.CSSProperties }): JSX.Element => {
            return <img src={`${API_ENTITY("File")}/raw/${item.fileID}?square=${square}${size ? `&size=${size}` : ""}`} style={style} />
        };
    }

    return <div className="photo" style={dragging ? { opacity: 0 } : {}}>
        <img src={`${API_ENTITY("File")}/raw/${fileID}?square=${square}${size ? `&size=${size}` : ""}`} ref={ref} {...props} />
        {!nodrag && <>{remove && idx != null && <button onClick={() => remove(idx)}>X</button>}
            <DragPreviewImage connect={dragPreview!} src={`${API_ENTITY("File")}/raw/${fileID}?square=${square}${size ? `&size=${size}` : ""}`} />
            <Preview generator={preview as any} />
        </>}
    </div>
}) as React.FunctionComponent<{
    fileID: number,
    size?: number,
    square?: boolean,
    idx?: number,
    move?: (id1: number, id2: number) => void,
    remove?: (id: number) => void,
    nodrag?: boolean
} & HTMLAttributes<HTMLImageElement>>;