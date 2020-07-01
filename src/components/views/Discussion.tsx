/*
 * SBS2 Frontend
 * Created on Tue May 05 2020
 *
 * Copyright (c) 2020 MasterR#C0RD
 */

import React from "react";
import { User, FullUser } from "../../classes/User";
import { Content } from "../../classes/Content";
import Grid from "../layout/Grid";
import Cell from "../layout/Cell";
import Link from "next/link";
import { Comment } from "../../classes/Comment";
import { IComment } from "../../interfaces/Views";
import DayJS from "dayjs";
import MarkupView from "../functional/MarkupView";
import Form from "../functional/Form";
import Send from "@iconify/icons-mdi/send";
import Compose from "@iconify/icons-bytesize/compose";
import { InlineIcon } from "@iconify/react";

export default (({
    self,
    discussion,
    comments,
    users,
    listeners
}) => {
    async function PostComment() {

    }

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
                <div className="comments-list">
                    {comments.map((comment, i) => {
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
                                <div className="comment-content">
                                    <MarkupView markupLang={comment.Markup} code={comment.Content} />
                                </div>
                            </div>
                        </div>
                    })}
                </div>
            </div>
            <Form className="discussion-input" onSubmit={PostComment}>
                <textarea />
                <div className="discussion-buttons">
                    <button type="submit">
                        <InlineIcon icon={Send} />
                    </button>
                    <button type="button">
                        <InlineIcon icon={Compose} />
                    </button>
                </div>
            </Form>
        </Cell>
    </Grid>;
}) as React.FunctionComponent<{
    self: FullUser | null,
    discussion: Content,
    comments: Comment[],
    listeners: User[],
    users: User[]
}>;