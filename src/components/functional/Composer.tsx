/*
 * SBS2 Frontend
 * Created on Wed May 06 2020
 *
 * Copyright (c) 2020 MasterR#C0RD
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import { InlineIcon } from "@iconify/react";
import MarkupView from "./MarkupView";
import { useDropzone } from "react-dropzone";
import { API_ENTITY } from "../../constants/ApiRoutes";
import Link from "next/link";

//#region Icons
import BxCode from "@iconify/icons-bx/bx-code";
import AlignLeft from "@iconify/icons-oi/align-left";
import AlignCenter from "@iconify/icons-oi/align-center";
import AlignRight from "@iconify/icons-oi/align-right";
import LinkIntact from "@iconify/icons-oi/link-intact";
import Image from "@iconify/icons-oi/image";
import List from "@iconify/icons-oi/list";
import CloudUpload from "@iconify/icons-mdi/cloud-upload-outline";
import Anchor from "@iconify/icons-vaadin/anchor";
import Poll from "@iconify/icons-mdi/poll";
import Hidden from "@iconify/icons-dashicons/hidden";
import YouTubeFilled from "@iconify/icons-ant-design/youtube-filled";
import DoubleQuote from "@iconify/icons-oi/double-quote-serif-left";
import Table from "@iconify/icons-mdi/table";

//#endregion

export default React.forwardRef(({
    code = "",
    markup = "",
    onChange = () => { },
    hidePreview = false,
}, ref) => {
    const [ccode, setCode] = useState("");
    const [cmarkup, setMarkup] = useState("12y")
    const areaRef = useRef<HTMLTextAreaElement>(null);
    const [preview, setPreview] = useState(!hidePreview);

    useEffect(() => {
        setCode(code);
        if (markup)
            setMarkup(markup);
    }, [code, markup]);

    let onDrop = useCallback(async (files: File[]) => {
        let file = files[0];
        if (file) {
            try {
                let d = await Intercept.Upload(file);
                return insertTag("img", `${API_ENTITY("File")}/raw/${d}`)();
            } catch (e) {
                console.error("Failed to upload file");
                console.error(e);
            }
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive, inputRef } = useDropzone({ onDrop, noClick: true, multiple: false, accept: "image/*" })

    function updatePreview(evt: React.FormEvent<HTMLTextAreaElement>) {
        setCode(evt.currentTarget.value);
    }

    function handleKeys(evt: React.KeyboardEvent<HTMLTextAreaElement>) {
        const area = evt.currentTarget;
        let pos = area.selectionStart;

        if (markup !== "bbcode") {
            return;
        } else if (evt.key == "Tab") {
            evt.preventDefault();
            area.value = area.value.substr(0, pos) + " ".repeat(4) + area.value.substr(pos);
            area.selectionStart = pos + 4;
        } else if (evt.ctrlKey && evt.key == "b") {
            evt.preventDefault();
            insertTag("b")();
        } else if (evt.ctrlKey && evt.key == "i") {
            evt.preventDefault();
            insertTag("i")();
        } else if (evt.ctrlKey && evt.key == "u") {
            evt.preventDefault();
            insertTag("u")();
        } else if (evt.ctrlKey && evt.key == "k") {
            evt.preventDefault();
            insertTag("url")();
        }
    }
    function insertTag(tagName: string, defaultContent?: string) {
        return () => {
            let area = areaRef.current!;
            const selectionStart = Math.min(area.selectionStart, area.selectionEnd) || 0;
            const selectionEnd = Math.max(area.selectionStart, area.selectionEnd) || 0;

            let between = area.value.substring(selectionStart, selectionEnd);
            if (between.length == 0)
                between = defaultContent || "";

            area.selectionStart = selectionStart + tagName.length + 2;
            area.selectionEnd = selectionEnd + tagName.length + 2;
            area.focus();

            setCode(area.value.substr(0, selectionStart) + `[${tagName}]` + between + `[/${tagName.substr(0, tagName.indexOf("=") == -1 ? tagName.length : tagName.indexOf("="))}]` + area.value.substr(selectionEnd));
            if (onChange)
                onChange(area.value, cmarkup);
        }
    }


    return (
        <div className="composer" data-previewhidden={!preview} ref={ref}>
            <div className="composer-editorwrapper" {...getRootProps()}>
                <input {...getInputProps()} />
                {isDragActive && <div className="composer-dropping">
                    <p>Drop here to upload</p>
                </div>}
                <textarea ref={areaRef} value={ccode} className="composer-editor" onInput={updatePreview} onKeyDown={handleKeys} name="composer-code" onChange={(evt) => onChange(evt.currentTarget.value, markup)} minLength={2}></textarea>
                <ul className="composer-commands" onClick={(evt) => evt.currentTarget == evt.target && areaRef.current!.focus()}>
                    {cmarkup == "bbcode" && <>
                        <li><button onClick={insertTag("b")} type="button" title="Bold"><b>B</b></button></li>
                        <li><button onClick={insertTag("i")} type="button" title="Italics"><i>I</i></button></li>
                        <li><button onClick={insertTag("u")} type="button" title="Underline"><u>U</u></button></li>
                        <li><button onClick={insertTag("s")} type="button" title="Strikethrough"><s>S</s></button></li>
                        <li><button onClick={insertTag("sup")} type="button" title="Superscript">X<sup>s</sup></button></li>
                        <li><button onClick={insertTag("sub")} type="button" title="Subscript">X<sub>s</sub></button></li>
                        <li><button onClick={insertTag("h1")} type="button" title="Heading 1">H1</button></li>
                        <li><button onClick={insertTag("h2")} type="button" title="Heading 2">H2</button></li>
                        <li><button onClick={insertTag("h3")} type="button" title="Heading 3">H3</button></li>
                        <li><button onClick={insertTag("align=left")} type="button" title="Align left"><InlineIcon icon={AlignLeft} /></button></li>
                        <li><button onClick={insertTag("align=center")} type="button" title="Align center"><InlineIcon icon={AlignCenter} /></button></li>
                        <li><button onClick={insertTag("align=right")} type="button" title="Align right"><InlineIcon icon={AlignRight} /></button></li>
                        <li><button onClick={insertTag("url=")} type="button" title="Link"><InlineIcon icon={LinkIntact} /></button></li>
                        <li><button onClick={insertTag("anchor=")} type="button" title="Anchor"><InlineIcon icon={Anchor} /></button></li>
                        <li><button onClick={insertTag("img")} type="button" title="Image"><InlineIcon icon={Image} /></button></li>
                        <li><button onClick={() => { inputRef.current?.click() }} type="button"><InlineIcon icon={CloudUpload} /></button></li>
                        <li><button onClick={insertTag("list")} type="button" title="List"><InlineIcon icon={List} /></button></li>
                        <li><button onClick={insertTag("poll")} disabled type="button" title="Poll"><InlineIcon icon={Poll} /></button></li>
                        <li><button onClick={insertTag("code")} type="button" title="Code"><InlineIcon icon={BxCode} /></button></li>
                        <li><button onClick={insertTag("spoiler")} type="button" title="Spoiler"><InlineIcon icon={Hidden} /></button></li>
                        <li><button onClick={insertTag("youtube")} type="button" title="YouTube"><InlineIcon icon={YouTubeFilled} /></button></li>
                        <li><button onClick={insertTag("quote")} type="button" title="Quote"><InlineIcon icon={DoubleQuote} /></button></li>
                        <li><button onClick={insertTag("table", "\n [tr]\n  [th]Table Heading 1[/th]\n  [th]Table Heading 2[/th]\n [/tr]\n[tr]\n  [td]Data1[/td]\n  [td]Data2[/td]\n [/tr]\n")} type="button" title="Table"><InlineIcon icon={Table} /></button></li>
                    </>}
                    {cmarkup == "12y" && <>
                        <li className="text">
                            *bold* /italic/ _underline_  ~strike~ !embedurl `code` <Link href="/pages/[pid]" as="/pages/765"><a>[More]</a></Link>
                        </li>
                    </>}
                    <li><select name="markup-lang" value={cmarkup} onChange={(evt) => { setMarkup(evt.currentTarget.value); onChange(ccode, evt.currentTarget.value) }} title="Markup language">
                        <option value="12y">12-Y-Markup</option>
                        <option value="bbcode">BBCode</option>
                        <option value="plaintext">Plaintext</option>
                    </select></li>
                    {hidePreview && <li><button onClick={() => { setPreview(!preview); areaRef.current!.focus() }} type="button" title="Show Preview">{preview ? "<" : ">"}</button></li>}
                </ul>
            </div>
            {
                preview &&
                <div className="composer-previewwrapper">
                    <MarkupView className="composer-preview" code={ccode} markupLang={cmarkup} />
                </div>
            }
        </div >
    );
}) as React.FunctionComponent<{
    onChange?: (value: string, markup: string) => any,
    code?: string,
    markup?: string,
    hidePreview?: boolean,
    ref?: React.Ref<HTMLDivElement>
}>;