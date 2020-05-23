/*
 * SBS2 Frontend
 * Created on Fri May 01 2020
 *
 * Copyright (c) 2020 MasterR3C0RD
 */

import isLength from "validator/lib/isLength";
import isEmail from "validator/lib/isEmail";

import { API_ENTITY } from "../constants/ApiRoutes";
import { EntityType, ISearchQuery, IUserCredential, IUserSensitiveUpdate } from "../interfaces/API";
import { IUser, IUserSelf } from "../interfaces/Views";

export class User implements IUser {
    readonly id: number;
    readonly username: string;
    readonly avatar: number;
    readonly createDate: Date;

    public constructor({ id, username, avatar, createDate }: IUser) {
        this.id = id;
        this.username = username;
        this.avatar = avatar;
        this.createDate = new Date(createDate);
    }

    static async Get(query: Partial<ISearchQuery>): Promise<User[]> {
        return Intercept.Read(EntityType.User, query, User);
    }

    public Avatar(size: number = 200, square: boolean = true): string {
        return User.Avatar({ username: this.username, avatar: this.avatar }, size, square);
    }

    public static Avatar(user: { username: string, avatar: number }, size: number = 200, square: boolean = true): string {
        if (user.avatar != 0)
            return `${API_ENTITY("File")}/raw/${user.avatar}?size=${size}&square=${square}`;
        else
            return `https://www.tinygraphs.com/labs/isogrids/hexa/${user.username}?theme=seascape&size=${size}`;
    }
}

export class FullUser extends User implements IUserSelf {
    readonly email: string;
    readonly super: boolean;
    readonly editDate: Date;
    readonly createUserId: number;
    readonly editUserId: number;

    public constructor({ id, username, avatar, createDate, email, super: sup, editDate, createUserId, editUserId }: IUserSelf) {
        super({ id, username, avatar, createDate });

        this.email = email;
        this.super = sup;
        this.editDate = editDate;
        this.createUserId = createUserId;
        this.editUserId = editUserId;
    }

    static async Register({ username, password, email }: IUserCredential): Promise<true> {
        await Intercept.Register({ username, password, email });
        return true;
    }

    static async Login(username: string, password: string): Promise<FullUser> {
        let creds: Partial<IUserCredential> = { password };
        if (isEmail(username)) {
            creds.email = username;
        } else if (isLength(username, { min: 3, max: 20 })) {
            creds.username = username;
        } else {
            throw ["Invalid username."];
        }

        await Intercept.Login(creds);
        return (await this.Self())!;
    }

    static async Self(): Promise<FullUser | null> {
        let view = (await Intercept.Self());

        return view ? new FullUser(view) : null;
    }

    static async Confirm(confirmKey: string): Promise<FullUser> {
        await Intercept.Confirm(confirmKey);
        return (await this.Self())!;
    }

    static async UpdateSensitive({ oldPassword, username, password, email }: Partial<IUserSensitiveUpdate> & { oldPassword: string }): Promise<FullUser> {
        await Intercept.UpdateSensitive({ oldPassword, username, password, email });
        return (await this.Self())!;
    }

    static async UpdateAvatar(avatar: File): Promise<FullUser> {
        if (!avatar.type.startsWith("image/")) {
            throw ["The avatar must be an image file."];
        }

        let file = await Intercept.Upload(avatar);
        await Intercept.UpdateAvatar(file.id);
        return (await this.Self())!;
    }
}