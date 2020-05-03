/*
 * SBS2 Frontend
 * Created on Fri May 01 2020
 *
 * Copyright (c) 2020 MasterR3C0RD
 */

import { IUser, IUserSelf } from "../interfaces/Views";
import { IUserCredential, IUserSensitiveUpdate } from "../interfaces/API";
import Validate from "validator";


export class User implements IUser {
    readonly id: number;
    readonly username: string;
    readonly avatar: number;
    readonly createDate: Date;

    public constructor({id, username, avatar, createDate}: IUser){
        this.id = id;
        this.username = username;
        this.avatar = avatar;
        this.createDate = new Date(createDate);
    }
}

export class FullUser extends User implements IUserSelf {
    readonly email: string;
    readonly super: boolean;
    readonly editDate: Date;
    readonly createUserId: number;
    readonly editUserId: number;

    public constructor({id, username, avatar, createDate, email, super: sup, editDate, createUserId, editUserId}: IUserSelf){
        super({id, username, avatar, createDate});
        
        this.email = email;
        this.super = sup;
        this.editDate = editDate;
        this.createUserId = createUserId;
        this.editUserId = editUserId;
    }

    static Register({username, password, email}: IUserCredential): Promise<IUserSelf> {
        if(!Validate.isEmail(email)){
            throw [ "Email is invalid." ];
        } else if(!Validate.isLength(username, {min: 3, max: 20})){
            throw [ "Username must be between 3 and 20 characters." ];
        } else if(!Validate.isLength(password, {min: 8})){
            throw [ "Password must be over 8 characters in length." ];
        }

        
    }

    static Login(username: string, password: string): Promise<string> {

    }
}