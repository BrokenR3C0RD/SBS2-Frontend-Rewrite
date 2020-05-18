/*
 * SBS2 Frontend
 * Created on Sun May 03 2020
 *
 * Copyright (c) 2020 MasterR3C0RD
 */

import React, { Children, useRef, useState, useEffect } from "react";

export default (({
    children,
    width,
    height,
    style = {},
    timer = 0,
    className = ""
}) => {
    const ref = useRef<HTMLDivElement>(null);
    const [selected, setSelected] = useState<number>(0);
    const [wait, setWait] = useState<boolean>(false);
    const childCount = Children.count(children);

    function nextImage(user = false) {
        if (wait && !user) {
            setWait(false);
            return;
        }
        if (ref.current && childCount > 0) {
            setSelected((selected + 1) % childCount);
        }
        setWait(user);
    }
    function prevImage(user = false) {
        if (wait && !user) {
            setWait(false);
            return;
        }
        if (ref.current && childCount > 0) {
            setSelected((selected + (childCount - 1)) % childCount);
        }
        setWait(user);
    }

    useEffect(() => {
        if (timer > 0) {
            const interval = setInterval(() => {
                nextImage();
            }, timer);
            return () => clearInterval(interval);
        }
    });
    return <div className={`gallery ${className}`} style={Object.assign({}, {
        width: width,
        height: height,
        lineHeight: height,
        boxSizing: "content-box"
    }, style)}>
        <div className="gallery-content" ref={ref}>
            {children}
        </div>
        {childCount > 1 && <>
            <div className="gallery-next" onClick={() => nextImage(true)} />
            <div className="gallery-prev" onClick={() => prevImage(true)} />
        </>}
        <style jsx>{`
            .gallery > .gallery-content > :global(*:nth-child(${selected + 1})){
                display: block;
                min-width: 0;
                min-height: 0;
                position: relative;
                max-width: ${width};
                max-height: ${height};
            }
        `}</style>
    </div>
}) as React.FunctionComponent<{
    width: string,
    height: string,
    style?: React.CSSProperties,
    timer?: number,
    className?: string,
} & React.HTMLAttributes<HTMLDivElement>>;