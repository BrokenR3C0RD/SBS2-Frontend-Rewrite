/*
 * SBS2 Frontend
 * Created on Fri May 01 2020
 *
 * Copyright (c) 2020 MasterR3C0RD
 */

import Validate from "validator";
import { Intercept } from "../global";
import { EntityType, IUserCredential, IUserSensitiveUpdate, ISearchQuery } from "../interfaces/API";
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

    static async Get(query: Partial<ISearchQuery>): Promise<User[]>{
        return Intercept.Read(EntityType.User, query, User);
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
        if (Validate.isEmail(username)) {
            creds.email = username;
        } else if (Validate.isLength(username, { min: 3, max: 20 })) {
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

    static async UpdateSensitive({ oldPassword, username, password, email }: Partial<IUserSensitiveUpdate>): Promise<FullUser> {
        await Intercept.UpdateSensitive({oldPassword, username, password, email});
        return (await this.Self())!;
    }

    static async UpdateAvatar(avatar: File): Promise<FullUser> {
        if(!avatar.type.startsWith("image/")){
            throw ["The avatar must be an image file."];
        }

        let file = await Intercept.Upload(avatar);
        await Intercept.UpdateAvatar(file.id);
        return (await this.Self())!;
    }
}