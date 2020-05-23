/*
 * SBS2 Frontend
 * Created on Fri May 08 2020
 *
 * Copyright (c) 2020 MasterR#C0RD
 */

import Nintendo3DS from "@iconify/icons-cib/nintendo-3ds";
import NintendoSwitch from "@iconify/icons-cib/nintendo-switch";
import NintendoWiiU from "@iconify/icons-cib/wiiu";
import CloudUpload from "@iconify/icons-mdi/cloud-upload-outline";
import Icon from "@iconify/react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { DndProvider } from "react-dnd";
import MultiBackend from "react-dnd-multi-backend";
import HTML5toTouch from "react-dnd-multi-backend/dist/cjs/HTML5toTouch";
import { useDropzone } from "react-dropzone";
import { Category } from "../../classes/Category";
// import DisplayMarkup from "../functional/MarkupView";
import { Content } from "../../classes/Content";
import FetchInfo, { KeyInfo } from "../../classes/SBAPI";
import { FullUser } from "../../classes/User";
import { useTree } from "../../hooks/Category";
import { Dictionary } from "../../interfaces/Generic";
import Composer from "../functional/Composer";
import Form from "../functional/Form";
import Photo from "../functional/Photo";
import UserPicker from "../functional/UserPicker";
import { CRUD } from "../../interfaces/API";
import DayJS from "dayjs";
import Calendar from "dayjs/plugin/calendar";
DayJS.extend(Calendar);

function byteSize(bytes: number) {
    let m = bytes;
    let unitSize = Math.floor(Math.log(bytes) / Math.log(1024));
    m /= 1024 ** unitSize;
    return `${m.toPrecision(3)} ${
        ["B", "kB", "MB", "GB"][unitSize]
        }`;
}

export default (({
    user, content, type: deftype, category: defcat, defaultMarkup = "12y"
}) => {
    const Router = useRouter();
    const [name, setName] = useState<string>("");
    const [key, setKey] = useState<string>("");
    const [type, setType] = useState(deftype || "@page.resource");
    const [code, setCode] = useState("");
    const [markup, setMarkup] = useState(defaultMarkup);
    const [users, setUsers] = useState<number[]>([]);
    const [photos, setPhotos] = useState<number[]>([]);
    const [keywords, setKeywords] = useState<string[]>([]);
    const [publicCommenting, setPublicCommenting] = useState<boolean>(true);
    const [isPrivate, setIsPrivate] = useState<boolean>(false);
    const [keyInfo, setKeyInfo] = useState<KeyInfo | null | false>();
    const [compatibilityDLC, setCompatibilityDLC] = useState<Dictionary<boolean | undefined>>({});
    const [category, setCategory] = useState<number>(defcat!);

    const [, pageTree] = useTree("Pages");
    const [, discussionTree] = useTree("Discussions");

    const { getInputProps, getRootProps, isDragAccept } = useDropzone({
        accept: "image/*",
        async onDrop(files: File[]) {
            for (let i = 0; i < files.length; i++) {
                try {
                    photos.push((await Intercept.Upload(files[i])).id);
                    setPhotos(photos);
                } catch (e) {
                    alert("An error occurred while uploading a file: " + e);
                }
            }
        }
    });

    useEffect(() => {
        if (content) {
            setName(content.name);
            setCode(content.content);
            setMarkup(content.Markup);
            setPhotos((content.GetValue("photos")?.split(",") || []).map((id: string) => +id));
            setType(content.type);
            setKey(content.GetValue("key") || "");
            setCompatibilityDLC(JSON.parse(content.GetValue("supported") || "{}"));
            setKeywords(content.keywords);
            setPublicCommenting(content.permissions["0"].indexOf("c") !== -1);
            setIsPrivate(content.permissions["0"].indexOf("r") === -1);

            if (content.type === "@page.program" && content.GetValue("key"))
                FetchKeyInfo(content.GetValue("key")!);
        }
    }, [content]);

    useEffect(() => {
        if (key.trim().length > 1 && (!keyInfo || keyInfo.path !== key)) {
            let to = setTimeout(() => FetchKeyInfo(), 3000);
            return () => clearTimeout(to);
        }
    }, [key, keyInfo]);

    function move(id1: number, id2: number) {
        let newPhotos = photos.slice();
        let o = newPhotos.splice(id1, 1);
        newPhotos.splice(id2, 0, o[0]);
        setPhotos(newPhotos);
    }

    async function FetchKeyInfo(ikey: string = key) {
        try {
            let info = await FetchInfo(ikey);
            if (info == null || !info.available) {
                setKeyInfo(false);
            } else {
                setKeyInfo(info);
                if (keywords.length === 0) {
                    setKeywords([
                        ...info.extInfo.tags,
                        ...(Object.keys(compatibilityDLC)),
                        ...(info.extInfo.console === "3DS" ? ["sb3"] : ["sb4"])
                    ]);
                }
                if (Object.values(compatibilityDLC).filter(val => val !== undefined).length === 0) {
                    setCompatibilityDLC({
                        ...compatibilityDLC,
                        "3ds": (info.extInfo.console === "3DS" ? false : undefined),
                        "switch": (info.extInfo.console == "Switch" ? false : undefined)
                    });
                }
            }
        } catch (e) {
            setKeyInfo(null);
        }
    }

    const usedTree = (type.indexOf("@discussion") === 0 ? discussionTree : pageTree);

    async function PostContent() {
        const userPerms: Dictionary<string> = {};
        for (let i = 0; i < users.length; i++) {
            userPerms[i] = "cru";
        }
        let res = await Content.Update({
            id: content?.id,
            type,
            name,
            content: code,
            values: {
                ...(content?.values || {}),
                key,
                markupLang: markup,
                photos: photos.filter(photo => photo != null && photo != 0).join(","),
                keyinfo: (keyInfo ? JSON.stringify(keyInfo) : undefined) as string,
                ...(type === "@page.program" ? { supported: JSON.stringify(compatibilityDLC) } : {})
            },
            parentId: category || usedTree?.id || 0,
            permissions: {
                ...(content?.permissions || {}),
                ...userPerms,
                "0": publicCommenting ? "cr" : isPrivate ? "" : "r",
            },
            keywords: [
                ...keywords
            ]
        });
        if (res != null)
            if (type.indexOf("@discussion") != -1) {
                await Router.push("/discussions/[id]", `/discussions/${res.id}`);
            } else {
                await Router.push("/pages/[id]", `/pages/${res.id}`);
            }
    }

    function Remove(idx: number) {
        let newPhotos = photos.slice();
        newPhotos.splice(idx, 1);
        setPhotos(newPhotos);
    }

    function valueOf(console: string) {
        return [undefined, false, true].indexOf(compatibilityDLC?.[console]);
    }
    function setValueOf(console: string, value: number) {
        setCompatibilityDLC({
            ...compatibilityDLC,
            [console]: [undefined, false, true][value]
        });
    }

    return <Form onSubmit={PostContent}>
        <h2>Name</h2>
        <input type="text" autoComplete="off" placeholder="Name" value={name} onChange={(evt) => setName(evt.currentTarget.value)} />
        <br />
        <h2>Content type</h2>
        <select value={type} onChange={(evt) => setType(evt.currentTarget.value)}>
            <option value="@page.resource">Resource</option>
            <option value="@page.program">Program</option>
            <option value="@discussion">Discussion</option>
        </select>
        <div>
            <b>What to pick:</b>
            <ul>
                <li>Pick "Resource" if you're submitting an informational page (documentation, tutorial, etc).</li>
                <li>Pick "Program" if you're submitting a SmileBASIC program.</li>
                <li>Pick "Discussion" if you're looking to create a discussion about a topic.</li>
            </ul>
        </div>
        <br />
        <h2>Category</h2>
        <p>
            Putting your submission in the correct category can improve the chances of discovery.
        </p>
        <select value={category} onChange={(evt) => setCategory(+evt.currentTarget.value)}>
            <option key={usedTree?.id} value={usedTree?.id}>{usedTree?.name}</option>

            {((type.indexOf("@discussion") == 0 ? discussionTree?.Children : pageTree?.Children) || [])
                .map((cat) => (function map(category: Category, depth: number = 1): JSX.Element {
                    return <>
                        <option key={category.id} value={category.id}>{"—".repeat(depth)} {category.name}</option>
                        {category.Children.map(child => map(child, depth + 1))}
                    </>
                })(cat))
            }
        </select>
        <br />
        {type == "@page.program" && <div>
            <h2>Program information:</h2>
            <input type="text" autoComplete="off" autoCorrect="off" placeholder="Key" value={key} onChange={(evt) => setKey(evt.currentTarget.value.trim())} />
            <button onClick={() => FetchKeyInfo()} type="button">Check</button>
            {keyInfo && <>
                {keyInfo.type == "PRJ" && keyInfo.extInfo.console === "Switch" && keyInfo.extInfo.files?.find(file => file.name === "META") && <img src={`//sbapi.me/get/${keyInfo.path}/META/icon`} style={{ width: "2em" }} />}
                <span className="key-name"><b> {keyInfo.extInfo.project_name || keyInfo.filename.substr(1)}</b></span>
                <div className="key-info">
                    <br />
                    <Icon icon={keyInfo.extInfo.console === "Switch" ? NintendoSwitch : Nintendo3DS} style={{ fontSize: "2em" }} />
                    <span className="key-console"><b> SmileBASIC for {keyInfo.extInfo.console === "3DS" ? "3DS/WiiU" : "Switch"}</b></span>
                    <br />
                    <table className="key-data">
                        <tbody>
                            <tr>
                                <td>
                                    Uploaded
                            </td>
                                <td>
                                    {DayJS(keyInfo.uploaded).calendar()}
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    Last updated
                            </td>
                                <td>
                                    {DayJS(keyInfo.extInfo.version * 1000).subtract(9, "h").calendar()}
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    Author
                            </td>
                                <td>
                                    {keyInfo.author.name}
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    Size
                            </td>
                                <td>
                                    {byteSize(keyInfo.size)}
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    Downloads
                            </td>
                                <td>
                                    {keyInfo.downloads}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </>
            }
            {
                keyInfo === false && <p className="errors">
                    The key you provided appears to be unavailable. If this is a mistake, please contact MasterR3C0RD.
            </p>
            }
            {
                keyInfo === null && <p className="errors">
                    For some reason, we weren't able to get information about this key.
                    You can still submit, but your program submission will be missing information.
            </p>
            }
            {
                keyInfo !== undefined && keyInfo !== false && <>
                    <br />
                    <h2>Compatibility</h2>
                    <table>
                        <tr>
                            <td><h3><Icon icon={Nintendo3DS} /> 3DS</h3></td>
                            <td><h3><Icon icon={NintendoWiiU} style={{ fontSize: "1.5em" }} /> WiiU</h3></td>
                            <td><h3><Icon icon={NintendoSwitch} /> Switch</h3></td>
                        </tr>
                        <tr>
                            <td>
                                <select value={valueOf("3ds")} onChange={evt => setValueOf("3ds", +evt.currentTarget.value)}>
                                    <option value={0}>Unsupported</option>
                                    <option value={1}>Supported</option>
                                    <option value={2}>Supported with DLC</option>
                                </select>
                            </td>
                            <td>
                                <select value={valueOf("wiiu")} onChange={evt => setValueOf("wiiu", +evt.currentTarget.value)}>
                                    <option value={0}>Unsupported</option>
                                    <option value={1}>Supported</option>
                                    <option value={2}>Supported with DLC</option>
                                </select>
                            </td>
                            <td>
                                <select value={valueOf("switch")} onChange={evt => setValueOf("switch", +evt.currentTarget.value)}>
                                    <option value={0}>Unsupported</option>
                                    <option value={1}>Supported</option>
                                </select>
                            </td>
                        </tr>
                    </table>
                </>
            }
            <br />
        </div >}
        <h2>Content</h2>
        <ul>
            <li>For resources, this is the content of your page.</li>
            <li>For programs, this is your description (about, controls, etc).</li>
            <li>For discussions, this is your topic.</li>
        </ul>
        <Composer code={code} markup={markup} onChange={(code, markup) => { setCode(code); setMarkup(markup); }} />
        <br />
        <h2>Editors</h2>
        <p>
            Editors can edit this submission (content, keywords, title), but they cannot revoke another user's permissions.
        </p>
        <UserPicker values={users} onChange={(users) => setUsers(users)} />
        <label>
            <input type="checkbox" checked={publicCommenting} onChange={() => setPublicCommenting(!publicCommenting)} />
            {` `}
            <b>Enable public commenting.</b> Note that editors can always comment on your submission.
        </label>
        {
            !publicCommenting && <label>
                <input type="checkbox" checked={isPrivate} onChange={(evt) => setIsPrivate(!isPrivate)} disabled={publicCommenting} />
                {` `}
                <b>Make private.</b> Only editors will be able to view this submission. You can always change this later.
        </label>
        }
        <br />
        <h2>Images</h2>
        <div className="images-list">
            <DndProvider backend={MultiBackend} options={HTML5toTouch}>
                {photos.map((photo, idx) => <Photo key={photo} fileID={photo} size={200} idx={idx} move={move} remove={Remove} />)}
            </DndProvider>
            <div {...getRootProps({ className: "file-upload" })}>
                <span>{isDragAccept ? <Icon icon={CloudUpload} /> : "+"}</span>
                <input {...getInputProps()} />
            </div>
        </div>
        <br />
        <h2>Keywords</h2>
        <p>
            We strongly recommend settings keywords, as they are extremely important if you want people
            to be able to easily find your content. <br />
            Keywords should reflect what you expect people will search to find your content. For example, an action RPG
            should add "action rpg" as keywords.<br />
            Keywords are separated by spaces.
        </p>
        <input type="text" placeholder="Keywords" value={keywords.join(" ")} onChange={evt => setKeywords(evt.currentTarget.value.split(" "))} />
        <br />
        <h2>Submit!</h2>
        <p>
            Before you submit, make sure you reach all of the requirements below:
        </p>
        <ul>
            <li>
                <label>
                    <input disabled type="checkbox" checked={name.length >= 1} />
                    {` Added a name (min. 1 character)`}
                </label>
            </li>
            {type === "@page.program" && <li><label>
                <input disabled type="checkbox" checked={keyInfo !== undefined && keyInfo !== false} />
                {` Set a key`}
            </label></li>}
            <li>
                <label>
                    <input disabled type="checkbox" checked={code.length >= 2} />
                    {` Added content (min. 2 characters)`}
                </label>
            </li>
            <li>
                <label>
                    <input disabled type="checkbox" checked={keywords.length >= 3} />
                    {` Add a minimum of 3 keywords to make your content more visible (optional)`}
                </label>
            </li>
        </ul>
        <p>
            When you're sure that you meet all of the requirements, click Submit below!
        </p>
        {content && (!user || !content.Permitted(user, CRUD.Update)) && <p className="errors">You do not have permission to edit this submission.</p>}
        <input type="submit" disabled={!(name.length >= 1 || code.length >= 2 || (type === "@page.program" && (keyInfo === undefined || keyInfo === false)) || (content && (!user || !content.Permitted(user, CRUD.Update))))} value="Submit" />
    </Form>
}) as React.FunctionComponent<{
    user: FullUser | null,
    content: Content | null,
    type: string,
    defaultMarkup?: string,
    category?: number
}>;