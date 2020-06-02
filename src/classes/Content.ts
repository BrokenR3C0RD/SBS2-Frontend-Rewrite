/*
 * SBS2 Frontend
 * Created on Tue May 05 2020
 *
 * Copyright (c) 2020 MasterR#C0RD
 */

import { EntityType, ISearchQuery, Vote } from "../interfaces/API";
import { IContent, ICommentAggregate, IAggregate } from "../interfaces/Views";
import { Category } from "./Category";
import { NamedEntity } from "./Entity";
import { User } from "./User";

export class Content extends NamedEntity implements IContent {
    EntityType = EntityType.Content;

    readonly type: string;
    readonly content: string;
    readonly keywords: string[];
    readonly about: {
        comments: IAggregate;
        watches: IAggregate;
        votes: {
            [i in Vote]: IAggregate
        },
        watching: boolean,
        myVote: Vote | null
    };

    public constructor({ id, createDate, editDate, createUserId, editUserId, parentId, permissions, myPerms, name, values, type, content, keywords, about }: IContent) {
        super({ id, createDate, editDate, createUserId, editUserId, parentId, permissions, myPerms, name, values });
        this.type = type;
        this.content = content;
        this.keywords = keywords;
        this.about = about;
    }

    public async Vote(vote: Vote | null): Promise<Content[]> {
        
    }

    public static async Get(query: Partial<ISearchQuery>): Promise<Content[]> {
        return await Intercept.Read(EntityType.Content, query, Content);
    }

    public static async Update(data: Partial<IContent>): Promise<Content | null> {
        if (data.id != null) {
            let res = await Intercept.Update<IContent>(EntityType.Content, (data as Partial<IContent> & { id: number }))
            if (res)
                return new Content(res);
            else
                return null;
        } else {
            let res = await Intercept.Create<IContent>(EntityType.Content, data);
            if (res)
                return new Content(res);
            else
                return null;
        }
    }

    public get Markup(): string {
        return this.GetValue("markupLang") || "12y";
    }

    public async ChangeParent(parent: Category): Promise<Content | null> {
        let c = new Content(this) as IContent;
        c.parentId = parent.id;
        return await Content.Update(c);
    }

    public async GetParent(parenType: typeof Category | typeof User = Category): Promise<Category | User | undefined> {
        return this.parentId > 0 ? (await parenType.Get({ ids: [this.parentId] }))[0] : undefined;
    }
}