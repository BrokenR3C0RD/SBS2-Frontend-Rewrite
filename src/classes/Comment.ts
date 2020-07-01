/*
 * SBS2 Frontend
 * Created on Tue May 05 2020
 *
 * Copyright (c) 2020 MasterR#C0RD
 */

// TODO: Implement comments
import { IComment } from "../interfaces/Views";
import { Entity } from "./Entity";
import { EntityType } from "../interfaces/API";
import { Content } from "./Content";

export class Comment extends Entity implements IComment {
    EntityType = EntityType.Comment;

    parentId: number;
    content: string;
    deleted: boolean;

    public constructor({ id, createDate, editDate, createUserId, editUserId, parentId, content, deleted }: IComment) {
        super({ id, createDate, editDate, createUserId, editUserId });
        this.parentId = parentId;
        this.content = content;
        this.deleted = deleted;
    }

    public static async Create(parent: Content, message: string, markup: string) {
        return Intercept.Create(EntityType.Comment, {
            parentId: parent.id,
            content: `${JSON.stringify({ 'm': markup })}\n${message}`
        } as Partial<IComment>)
    }

    public get Markup(): string {
        return JSON.parse(this.content.split("\n")[0]).m;
    }
    public get Content(): string {
        return this.content.indexOf("\n") == -1
            ? JSON.parse(this.content).t
            : this.content.split("\n").slice(1).join("\n");
    }
}