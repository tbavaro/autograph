import { Headers } from "request";
import * as Request from "request-promise-native";
import * as GoogleApi from "../google/GoogleApi";
import { DatastoreStatus } from "./DatastoreStatus";
import { BasicListenable } from "./Listenable";

type Maybe<T> = T | undefined;

export { DatastoreStatus };

export interface DatastoreLoadFileResult<T> {
  id: string;
  name: string;
  content: T;
  canSave: boolean;
}

// function transformLoadFileResult<T, U>(
//   original: DatastoreLoadFileResult<T>,
//   transform: (value: T) => U
// ): DatastoreLoadFileResult<U> {
//   return {
//     id: original.id,
//     name: original.name,
//     content: transform(original.content),
//     canSave: original.canSave
//   };
// }

export class Datastore extends BasicListenable<"status_changed"> {
  private _status = DatastoreStatus.Initializing;
  private _accessToken?: string;
  private _reloadAccessTokenTimeoutId?: number;
  private _files?: GoogleApi.DriveFilesResource;

  constructor() {
    super();
    GoogleApi.filesSingleton().then((files) => {
      this._files = files;

      // listen for sign-in state changes
      GoogleApi.getAuthInstance().isSignedIn.listen(this.updateIsSignedIn);

      // handle the initial sign-in state
      this.updateIsSignedIn(GoogleApi.getAuthInstance().isSignedIn.get());
    });
  }

  public status() {
    return this._status;
  }

  public signIn() {
    if (this._status === DatastoreStatus.SignedOut) {
      GoogleApi.getAuthInstance().signIn();
    }
  }

  public signOut() {
    if (this.isSignedIn()) {
      GoogleApi.getAuthInstance().signOut();
    }
  }

  public currentUserName(): Maybe<string> {
    return this.maybeGetProfileData(p => p.getName());
  }

  public currentUserEmail(): Maybe<string> {
    return this.maybeGetProfileData(p => p.getEmail());
  }

  public currentUserImageUrl(): Maybe<string> {
    return this.maybeGetProfileData(p => p.getImageUrl());
  }

  private getFileMetadata(fileId: string): PromiseLike<GoogleApi.DriveFile> {
    return this.filesResource().get({
      fileId: fileId,
      fields: "name, capabilities",
      key: GoogleApi.config.API_KEY
    }).then((f) => f.result);
  }

  private addQueryParams(url: string, queryParams: { [k: string]: string }) {
    const queryKeys = Object.keys(queryParams);
    if (queryKeys.length === 0) {
      return url;
    }

    url += (url.includes("?") ? "&" : "?");

    const queryParts = queryKeys.map((key) => {
      const value = ("" + queryParams[key]);
      return encodeURIComponent(key) + "=" + encodeURIComponent(value);
    });

    return url + queryParts.join("&");
  }

  private loadFileContent(fileId: string): PromiseLike<string> {
    const url = this.addQueryParams(
      "https://www.googleapis.com/drive/v3/files/" + encodeURIComponent(fileId),
      {
        "alt": "media",
        "key": GoogleApi.config.API_KEY
      }
    );
    const headers: Headers = {};
    if (this._accessToken) {
      headers.Authorization = "Bearer " + this._accessToken;
    }

    return Request.get(url, { headers: headers });
  }

  private interpretCanSave(metadata: GoogleApi.DriveFile) {
    return metadata.capabilities ? (metadata.capabilities.canEdit || false) : false;
  }

  public canSave(fileId: string): PromiseLike<boolean> {
    return this.getFileMetadata(fileId).then(
      (metadata) => this.interpretCanSave(metadata),
      () => false
    );
  }

  public loadFile(fileId: string): PromiseLike<DatastoreLoadFileResult<string>> {
    return Promise.all([
      this.getFileMetadata(fileId),
      this.loadFileContent(fileId)
    ]).then(([metadata, content]) => {
      return {
        id: fileId,
        name: metadata.name || "Untitled",
        content: content,
        canSave: this.interpretCanSave(metadata)
      };
    });
  }

  public saveFileAs(name: string, data: string, mimeType: string): PromiseLike<string> {
    if (!this.isSignedIn()) {
      return Promise.reject(new Error("not logged in"));
    }

    const uri = this.addQueryParams(
      "https://www.googleapis.com/upload/drive/v3/files",
      {
        "uploadType": "multipart",
        "key": GoogleApi.config.API_KEY
      }
    );
    const metadata: GoogleApi.DriveFile = {
      name: name,
      mimeType: mimeType
    };
    return Request({
      uri: uri,
      method: "POST",
      headers: {
        "Authorization": "Bearer " + this._accessToken
      },
      multipart: {
        data: [
          {
            "content-type": "application/json",
            body: JSON.stringify(metadata)
          },
          {
            "content-type": "application/json",
            body: data
          }
        ]
      }
    }).then((result) => {
      if (typeof result !== "string") {
        throw new Error("unexpected save result");
      }
      const resultData = JSON.parse(result);
      if (resultData.id === undefined) {
        throw new Error("didn't receive id");
      }
      return resultData.id;
    });
  }

  public updateFile(fileId: string, data: string): PromiseLike<void> {
    const uri = this.addQueryParams(
      "https://www.googleapis.com/upload/drive/v3/files/" + encodeURIComponent(fileId),
      {
        "key": GoogleApi.config.API_KEY
      }
    );

    return Request.patch({
      uri: uri,
      headers: {
        "Authorization": "Bearer " + this._accessToken
      },
      body: data
    }) as PromiseLike<void>;
  }

  private filesResource() {
    if (!this._files) {
      throw new Error("gapi files not initialized");
    }
    return this._files;
  }

  private isSignedIn() {
    return (this._status === DatastoreStatus.SignedIn);
  }

  private updateIsSignedIn = (newValue: boolean) => {
    const newStatus = (newValue ? DatastoreStatus.SignedIn : DatastoreStatus.SignedOut);
    if (this._status !== newStatus) {
      // clear caches and reload access token timer
      this._accessToken = undefined;
      if (this._reloadAccessTokenTimeoutId) {
        clearTimeout(this._reloadAccessTokenTimeoutId);
        this._reloadAccessTokenTimeoutId = undefined;
      }

      // if newly signed in...
      if (newStatus === DatastoreStatus.SignedIn) {
        this._accessToken = GoogleApi.getAuthInstance().currentUser.get().getAuthResponse().access_token;
        this.scheduleAuthReload();
      }

      // make it official
      this._status = newStatus;
      this.triggerListeners("status_changed");
    }
  }

  private doAuthReload = () => {
    if (this.isSignedIn()) {
      GoogleApi.getAuthInstance().currentUser.get().reloadAuthResponse().then((response) => {
        this._accessToken = response.access_token;
        this.scheduleAuthReload();
      });
    }
  }

  private scheduleAuthReload = () => {
    if (this._reloadAccessTokenTimeoutId) {
      clearTimeout(this._reloadAccessTokenTimeoutId);
      this._reloadAccessTokenTimeoutId = undefined;
    }

    const secondsToExpire = GoogleApi.getAuthInstance().currentUser.get().getAuthResponse().expires_in;
    const secondsToWaitBeforeReload = Math.max(1, secondsToExpire - 120);
    this._reloadAccessTokenTimeoutId = window.setTimeout(this.doAuthReload, secondsToWaitBeforeReload * 1000);
  }

  private maybeGetProfileData<T>(func: (profile: GoogleApi.BasicProfile) => T): Maybe<T> {
    if (this.isSignedIn()) {
      return func(GoogleApi.getAuthInstance().currentUser.get().getBasicProfile());
    } else {
      return undefined;
    }
  }
}