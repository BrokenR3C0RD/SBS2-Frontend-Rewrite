/*
 * SBS2 Frontend
 * Created on Fri May 22 2020
 *
 * Copyright (c) 2020 MasterR#C0RD
 */

import { GetServerSideProps } from "next";
import { useEffect, useState } from "react";
import { CacheDriver } from "../../classes/CacheDriver";
import { IChainedRequest } from "../../interfaces/Driver";
import { Dictionary } from "../../interfaces/Generic";

const ENV = typeof process === "undefined" ? false : !process.browser;
