/*
 * SBS2 Frontend
 * Created on Tue May 05 2020
 *
 * Copyright (c) 2020 MasterR#C0RD
 */

import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
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
import { useInView } from "react-intersection-observer";
import Spinner from "../layout/Spinner";

type MergedComments = IComment & { Contents: { content: string, markup: string }[] }

const DiscussionInput = (({
    discussion
}) => {
    const [composer, setComposer] = useState<boolean>(false);
    const [code, setCode] = useState<string>("");
    const [markup, setMarkup] = useState<string>("plaintext");

    async function PostComment() {
        Comment.Create(discussion, code, markup);
        setCode("");
        return true;
    }

    return <Form className="discussion-input" onSubmit={PostComment}>
        {composer
            ? <Composer hidePreview code={code} markup={markup} onChange={(code, markup) => { setCode(code); setMarkup(markup); }} />
            : <textarea value={code} onInput={evt => setCode(evt.currentTarget.value)} onKeyPress={evt => {
                if (!evt.shiftKey && evt.key == "Enter") { evt.preventDefault(); PostComment(); }
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
}) as React.FunctionComponent<{
    discussion: Content
}>;

export default (({
    self,
    discussion,
    comments,
    users,
    listeners,
    loading,
    more,
    loadMore
}) => {
    const [mcomments, setMComments] = useState<MergedComments[]>([]);
    const [ref, inView] = useInView({
        threshold: 1
    });

    useEffect(() => {
        if (!loading && inView && more) {
            loadMore();
        }
    }, [inView, loading]);


    const [lastCommentLength, setLastCommentLength] = useState<number>(0);
    const divRef = useRef<HTMLDivElement>(null);

    const scrollRef = useRef({
        shouldScroll: false,
        isScrolling: false,
        lastLoading: false,
        loadScrollTop: 0,
        loadScrollHeight: 0
    });
    let scrollDistance = () => Math.floor(divRef.current!.scrollHeight - divRef.current!.clientHeight - divRef.current!.scrollTop);

    function autoScrollAnimation() {
        if (scrollRef.current.isScrolling || !scrollRef.current.shouldScroll)
            return;

        scrollRef.current.isScrolling = true;
        var distance = scrollDistance();

        //Now shift the window by an amount proportional to the distance (up to a minimum).
        divRef.current!.scrollTop += Math.max(Math.ceil(distance / 4), 1);

        scrollRef.current.isScrolling = false;
        if (scrollDistance() > 0 && scrollRef.current.shouldScroll)
            requestAnimationFrame(() => autoScrollAnimation());
    }

    useLayoutEffect(() => {
        if (lastCommentLength == 0 || divRef.current!.scrollTop >= (divRef.current!.scrollHeight - divRef.current!.clientHeight * 5 / 4)) {
            scrollRef.current.shouldScroll = true;
            autoScrollAnimation();
        }

        if (divRef.current!.scrollHeight !== divRef.current!.clientHeight)
            setLastCommentLength(comments.length);
    });

    useLayoutEffect(() => {
        if (scrollRef.current.lastLoading != loading) {
            if (loading) {
                scrollRef.current.shouldScroll = false;
                scrollRef.current.loadScrollHeight = divRef.current!.scrollHeight - divRef.current!.clientHeight;
            } else {
                divRef.current!.scrollTop = scrollRef.current.loadScrollHeight;
            }
            scrollRef.current.lastLoading = true;
        }
    }, [loading]);

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
    }, [comments.length]);

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
                    {more && <div className="comments-loadmore" ref={ref}>
                        {loading && <Spinner />}
                    </div>}
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
                <DiscussionInput discussion={discussion} />
            </div>
        </Cell>
    </Grid>;
}) as React.FunctionComponent<{
    self: FullUser | null,
    discussion: Content,
    comments: Comment[],
    listeners: User[],
    users: User[],
    loading: boolean,
    more: boolean,
    loadMore: () => void
}>;