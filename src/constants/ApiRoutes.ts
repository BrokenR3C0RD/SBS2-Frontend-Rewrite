/*
 * SBS2 Frontend
 * Created on Fri May 01 2020
 *
 * Copyright (c) 2020 MasterR3C0RD
 */


export const API_ROOT = "//newdev.smilebasicsource.com";
export const API_ENTITY = (type: string) => `${API_ROOT}/api/${type === "commentaggregate" ? "comment/aggregate" : type}`;
export const API_CHAIN = `${API_ROOT}/api/read/chain`;