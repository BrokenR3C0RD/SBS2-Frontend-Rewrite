/*
 * SBS2 Frontend
 * Created on Tue May 05 2020
 *
 * Copyright (c) 2020 MasterR#C0RD
 */

import React, { useState, useEffect, useRef } from "react";
import { User, FullUser } from "../../classes/User";
import { Content } from "../../classes/Content";
import Grid from "../layout/Grid";
import Cell from "../layout/Cell";
import Link from "next/link";
import { Comment } from "../../classes/Comment";
import DayJS from "dayjs";
import MarkupView from "../functional/MarkupView";
import Form from "../functional/Form";
import Send from "@iconify/icons-mdi/send";
import Compose from "@iconify/icons-bytesize/compose";
import { InlineIcon } from "@iconify/react";
import Composer from "../functional/Composer";
import { IComment } from "../../interfaces/Views";
import ResizeObserver from "resize-observer-polyfill";

type MergedComments = IComment & { Contents: { content: string, markup: string }[] }

export default (({
    self,
    discussion,
    comments,
    users,
    listeners
}) => {
    const [composer, setComposer] = useState<boolean>(false);
    const [code, setCode] = useState<string>("");
    const [markup, setMarkup] = useState<string>("plaintext");
    const [mcomments, setMComments] = useState<MergedComments[]>([]);

    async function PostComment() {
        Comment.Create(discussion, code, markup);
        setCode("");
        return true;
    }

    useEffect(() => {
        let last: MergedComments | null = null;
        let coms: MergedComments[] = [];

        for (let i = 0; i < comments.length; i++) {
            let cur = comments[i];
            if (last != null && cur.createUserId == last.createUserId) {
                last.Contents.push({ content: cur.Content, markup: cur.Markup });
            } else {
                coms.push(last = {
                    ...cur,
                    Contents: [{ content: cur.Content, markup: cur.Markup }]
                });
            }
        }

        setMComments(coms);
    }, [comments]);

    // Autoscroll
    const divRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (divRef.current) {
            let resizeObserver = new ResizeObserver((entries) => {
                let entry = entries[0].target;
                if (entry.scrollTop >= (entry.scrollHeight - entry.clientHeight * 5 / 4)) {
                    entry.scrollTo({
                        top: entry.scrollHeight - entry.clientHeight,
                        left: 0,
                        behavior: "smooth"
                    });
                }
            });
            resizeObserver.observe(divRef.current!);
            return () => resizeObserver.disconnect();
        }
    });

    return <Grid
        className="discussions-grid"
        cols={["100%"]}
        rows={["1fr"]}>
        <Cell className="discussion-view" x={1} y={1}>
            <div className="discussion-comments">
                <ul className="comment-listeners">
                    {listeners.map(
                        (listener, i) => <li key={i}>
                            <Link href="/user/[id]" as={`/user/${listener.id}`}>
                                <a>
                                    <img src={listener.Avatar(64, true)} title={listener.username} />
                                </a>
                            </Link>
                        </li>
                    )}
                </ul>
                <div className="comments-list" ref={divRef}>
                    {mcomments.map((comment, i) => {
                        let user = users.find(user => user.id == comment.createUserId);
                        if (user == null)
                            return null;

                        return <div key={i} className="comment">
                            <img src={user.Avatar(64, true)} className="avatar" />
                            <div className="comment-body">
                                <div className="user-info">
                                    <span className="username">
                                        <Link href="/user/[id]" as={`/user/${user.id}`}>
                                            <a>{user.username}</a>
                                        </Link>
                                    </span>
                                    <div className="buttons">

                                    </div>
                                    <span className="editdate">
                                        {DayJS(comment.createDate).calendar()}
                                    </span>
                                </div>
                                {comment.Contents.map((comment, j) =>
                                    <div className="comment-content" key={j} >
                                        <MarkupView markupLang={comment.markup} code={comment.content} />
                                    </div>
                                )}
                            </div>
                        </div>
                    })}
                </div>
            </div>
            <Form className="discussion-input" onSubmit={PostComment}>
                {composer
                    ? <Composer hidePreview code={code} markup={markup} onChange={(code, markup) => { setCode(code); setMarkup(markup); }} />
                    : <textarea value={code} onInput={evt => setCode(evt.currentTarget.value)} onKeyPress={evt => {
                        if (!evt.shiftKey && evt.key == "Enter") { evt.preventDefault(); PostComment() }
                    }} />}
                < div className="discussion-buttons" >
                    <button type="submit">
                        <InlineIcon icon={Send} />
                    </button>
                    <button type="button" onClick={() => setComposer(!composer)}>
                        <InlineIcon icon={Compose} />
                        {` ${markup == "plaintext" ? "" : markup}`}
                    </button>
                </div>
            </Form>
        </Cell>
    </Grid >;
}) as React.FunctionComponent<{
    self: FullUser | null,
    discussion: Content,
    comments: Comment[],
    listeners: User[],
    users: User[]
}>;