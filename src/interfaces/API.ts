/*
 * SBS2 Frontend
 * Created on Fri May 01 2020
 *
 * Copyright (c) 2020 MasterR3C0RD
 */

/**
 * Represents a search query sent to the server to request an Entity.
 */
export interface ISearchQuery {
    keyword: string,
    type: string,
    name: string,
    username: string,
    parentids: number[],
    ids: number[],
    createstart: Date,
    createend: Date,
    maxid: number,
    minid: number,
    limit: number,
    skip: number,
    sort: "ids" | "random",
    reverse: boolean
}

/**
 * Represents an activity filter
 */
export interface IActivityFilter extends ISearchQuery {
    userIds: number[],
    contentIds: number[],
    includeAnonymous: boolean,
    recentCommentTime: string
}

/**
 * Represents a user's login credentials.
 */
export interface IUserCredential {
    username: string,
    password: string,
    email: string
}

/**
 * Represents an update of a user's sensitive information 
 */
export interface IUserSensitiveUpdate extends Partial<IUserCredential> {
    oldPassword: string;
}

export enum CRUD {
    Create = "c",
    Read = "r",
    Update = "u",
    Delete = "d"
}

export enum EntityType {
    Category = "category",
    Comment = "comment",
    Content = "content",
    File = "file",
    User = "user",
    CommentAggregate = "commentaggregate",
    Activity = "activity"
}